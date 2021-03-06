// --- Campaign table ---
w2ui['bottom'].html('main', $().w2grid({
    name: 'campaign',
    header: w2utils.lang('Campaign'),
    keyboard : false,
    show: {
        header: true,
        toolbar: true,
        footer: true,
        toolbarDelete: false,
        toolbarAdd: true,
        toolbarSearch: true
    },
    columns: [
        { field: 'recid', text: w2utils.lang('Id'), size: '50px', sortable: true, attr: "align=right" },
        { field: 'name', text: w2utils.lang('Name'), size: '100%', sortable: true }
    ],
    multiSelect: false,
    sortData: [{ field: 'recid', direction: 'DESC' }],
    url: '/api/campaigns',
    method: 'GET',
    postData: { cmd:"get" },
    toolbar: {
        items: [
            {id: 'rename', type: 'button', text: w2utils.lang('Rename'), icon: 'w2ui-icon-pencil'},
            {id: 'clone', type: 'button', text: w2utils.lang('Clone'), icon: 'w2ui-icon-columns'},
            {type: 'break'},
            {id: 'reports', type: 'menu-radio', icon: 'w2ui-icon-info', items: [
                    { id: 'recipients', text: w2utils.lang('Recipients')},
                    { id: 'clicks', text: w2utils.lang('Clicks')},
                    { id: 'unsubscribed', text: w2utils.lang('Unsubscribed')},
                    { id: 'question', text: w2utils.lang('Question')},
                    { id: 'useragent', text: w2utils.lang('User agent')}
                ],
                text: function (item) {
                    let el   = this.get('reports:' + item.selected);
                    return w2utils.lang('Report') + ": " + el.text;
                },
                selected: 'recipients'
            },
            {id: 'download', type: 'button', text: w2utils.lang('Download')}
        ],

        onClick: function (event) {
            switch (event.target) {
                case 'download':
                    if (w2ui['campaign'].getSelection()[0] === undefined) {
                        w2alert(w2utils.lang('Select campaign for download this report.'));
                        return;
                    }
                    loadLink('/report/campaign?id=' + w2ui['campaign'].getSelection()[0] + '&type=' + this.get('reports').selected + '&format=csv');
                    break;

                case 'clone':
                    if (w2ui['campaign'].getSelection()[0] === undefined) {
                        w2alert(w2utils.lang('Select campaign for clone.'));
                        return;
                    }
                    w2confirm(w2utils.lang('Are you sure you want to clone a campaign?'), function (btn) {
                        if (btn === 'Yes') {
                            $.ajax({
                                type: "GET",
                                //async: false,
                                dataType: 'json',
                                data: {"request": JSON.stringify({"cmd": "clone", "id": parseInt(w2ui['campaign'].getSelection()[0], 10)})},
                                url: '/api/campaigns'
                            }).done(function(data) {
                                if (data['status'] === 'error') {
                                    w2alert(w2utils.lang(data["message"]));
                                } else {
                                    id = data["recid"];
                                    name = data["name"];
                                    w2ui.campaign.add({recid: id, name: name}, true);
                                    w2ui['campaign'].select(id);
                                }
                            });
                        }
                    });
                    break;

                case "rename":
                    if (w2ui['campaign'].getSelection()[0] === undefined) {
                        w2alert(w2utils.lang('Select campaign for rename.'));
                        return;
                    }
                    let cID = parseInt(w2ui['campaign'].getSelection()[0], 10);
                    w2prompt({
                        label: w2utils.lang('Name'),
                        value: w2ui['campaign'].get(cID).name,
                        title: w2utils.lang('Rename campaign'),
                        ok_text: w2utils.lang('Ok'),
                        cancel_text: w2utils.lang('Cancel'),
                    }).ok((name) => {
                        w2ui['campaign'].set(cID, { w2ui: { changes: { name: name } } });
                        w2ui['campaign'].postData["cmd"] = "save";
                        w2ui['campaign'].save();
                    });
                    break;
            }
        }
    },

    onAdd: function () {
        w2prompt({
            label: w2utils.lang('Name'),
            title: w2utils.lang('Add campaign'),
            ok_text: w2utils.lang('Ok'),
            cancel_text: w2utils.lang('Cancel'),
        }).ok((name) => {
            console.log("add campaign name "+name)
            let gID = parseInt(w2ui['group'].getSelection()[0], 10);
            $.ajax({
                type: "GET",
                dataType: 'json',
                data: {"request": JSON.stringify({"cmd": "add", "id": gID, "name": name})},
                url: '/api/campaigns'
            }).done(function(data) {
                if (data['status'] === 'error') {
                    w2alert(w2utils.lang(data["message"]), w2utils.lang('Error'));
                } else {
                    w2ui['campaign'].add({recid: data["recid"], name: data["name"]},true);
                    w2ui['campaign'].select(data["recid"]);
                }
            });
        });
    },

    onSelect: function (event) {
        var record = this.get(event.recid);
        getCampaign(record.recid, record.name)
    },

    onSave: function(event) {
        w2ui['campaign'].postData["cmd"] = "save";
    }
}));
// --- /Campaign table ---

// --- Get campaign data ---
function getCampaign(recid, name) {
    w2ui.layout.lock('main', w2utils.lang('Loading...'), true);
    var campaignData = getCampaignData(recid);

    refreshProfilesList(campaignData.profiles, campaignData.profileID);
    refreshSenderList(campaignData.senders, campaignData.senderID);

    $('#campaignId').val(recid);
    $('#campaignName').val(name);
    $("#campaignSubject").val(campaignData.subject);
    $("#campaignStartDate").val(w2utils.formatDate(campaignData.startDate, w2utils.settings.dateFormat));
    $("#campaignStartTime").val(w2utils.formatTime(campaignData.startDate, w2utils.settings.timeFormat));
    $("#campaignEndDate").val(w2utils.formatDate(campaignData.endDate, w2utils.settings.dateFormat));
    $("#campaignEndTime").val(w2utils.formatTime(campaignData.endDate, w2utils.settings.timeFormat));
    $("#campaignSendUnsubscribe").prop("checked", campaignData.sendUnsubscribe);
    $("#campaignCompressHTML").prop("checked", campaignData.compressHTML);
    $("#campaignTemplateHTML").val(campaignData.templateHTML);
    $("#campaignTemplateText").val(campaignData.templateText);
    $("#campaignTemplateAMP").val(campaignData.templateAMP);

    setAcceptSend(campaignData.accepted);

    cmHTML.setValue(campaignData.templateHTML);
    cmAMP.setValue(campaignData.templateAMP);

    w2ui['recipient'].postData["campaign"] = parseInt(recid, 10);
    w2ui.layout.unlock('main');

    w2ui['toolbar'].click('parametersButton');
}

function getCampaignData(campaignId) {
    var campaignData = {
        subject: "",
        profiles: [{}],
        profileID: 0,
        profileName: "",
        senders: [{}],
        senderID: 0,
        senderName: "",
        startDate: Date(),
        endDate: Date(),
        sendUnsubscribe: false,
        compressHTML: false,
        accepted: false,
        templateHTML: "",
        templateText: "",
        templateAMP: ""
    };
    $.ajax({
        type: "GET",
        async: false,
        url: '/api/campaign',
        dataType: 'json',
        data: {"request": JSON.stringify({"cmd": "get", "id": parseInt(campaignId, 10)})}
    }).done(function(data) {
        campaignData.subject = data["subject"];
        campaignData.profileID = data["profileId"];
        campaignData.senderID = data["senderId"];
        // time from server in UTC, add offset
        var zone = new Date().getTimezoneOffset() * 60000;
        campaignData.startDate = new Date((data["startDate"] * 1000) + zone);
        campaignData.endDate = new Date((data["endDate"] * 1000) + zone);
        campaignData.sendUnsubscribe = data["sendUnsubscribe"];
        campaignData.compressHTML = data["compressHTML"];
        campaignData.accepted = data["accepted"];
        campaignData.templateHTML = data["templateHTML"];
        campaignData.templateText = data["templateText"];
        campaignData.templateAMP = data["templateAMP"];
    });
    $.ajax({
        type: "GET",
        async: false,
        url: '/api/profilelist',
        data: {"request": JSON.stringify({"cmd": "get"})},
        dataType: "json"
    }).done(function(data) {
        campaignData.profiles = data;
        campaignData.profiles.forEach(function(v) {
           if (v.id === campaignData.profileID) {
               campaignData.profileName = v.text;
           }
        });
    });
    $.ajax({
        type: "GET",
        async: false,
        url: '/api/senderlist',
        dataType: "json",
        data: {"request": JSON.stringify({"cmd": "get", "id": parseInt(w2ui['group'].getSelection()[0], 10)})}
    }).done(function(data) {
        campaignData.senders = data;
        campaignData.senders.forEach(function(v) {
            if (v.id === campaignData.senderID) {
                campaignData.senderName = v.text;
            }
        });
    });

    return campaignData;
}

function getTimestamp(dateStr, timeStr) {
    var d = new Date(w2utils.isDateTime(dateStr + ' ' + timeStr, w2utils.settings.datetimeFormat, true));
    return (d.getTime() - (d.getTimezoneOffset() * 60000))/1000;
}

// ---Save campaign data ---
function saveCampaign() {
    if (w2ui['toolbar'].get('acceptSend').checked) {
        w2alert(w2utils.lang("You can't save an accepted for send campaign."), w2utils.lang('Error'));
        return
    }
    w2confirm(w2utils.lang('Save changes in campaign?'), function (btn) {
        if (btn === 'Yes') {
            // ---Save campaign data ---
            w2ui.layout.lock('main', w2utils.lang('Saving...'), true);
            $.ajax({
                type: "POST",
                url: '/api/campaign',
                dataType: "json",
                data: {"request": JSON.stringify(
                        {
                            "cmd": "save",
                            "id": parseInt($('#campaignId').val(), 10),
                            "content": {
                                "profileId": $('#campaignProfileId').data('selected').id,
                                "name": $('#campaignName').val(),
                                "subject": $("#campaignSubject").val(),
                                "senderId": $('#campaignSenderId').data('selected').id,
                                "startDate": getTimestamp($("#campaignStartDate").val(), $("#campaignStartTime").val()),
                                "endDate": getTimestamp($("#campaignEndDate").val(), $("#campaignEndTime").val()),
                                "compressHTML": $("#campaignCompressHTML").is(":checked"),
                                "sendUnsubscribe": $("#campaignSendUnsubscribe").is(":checked"),
                                "templateHTML": cmHTML.getValue(),
                                "templateText": $("#campaignTemplateText").val(),
                                "templateAMP": cmAMP.getValue()
                            }
                        }
                    )}
            }).done(function(data) {
                if (data['status'] === 'error') {
                    w2alert(w2utils.lang(data["message"]), w2utils.lang('Error'));
                } else {
                    w2ui.layout.lock('main', w2utils.lang('Saved'), false);
                }
                setTimeout(function(){
                    w2ui.layout.unlock('main');
                }, 1000);
            });
        }
    });
}

function refreshProfilesList(profiles, profileID){
    w2ui['parameter'].set('campaignProfileId', { options: { items: profiles } });
    w2ui['parameter'].record['campaignProfileId'] = profileID;
    w2ui['parameter'].refresh();
}

function refreshSenderList(senders, senderID){
    w2ui['parameter'].set('campaignSenderId', { options: { items: senders } });
    w2ui['parameter'].record['campaignSenderId'] = senderID;
    w2ui['parameter'].refresh();
}
