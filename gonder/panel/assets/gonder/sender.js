// --- Sender emails editor ---
$().w2layout({
    name: 'senderEditor',
    padding: 4,
    panels: [
        { type: 'left', size: '30%', resizable: true, minSize: 300 },
        { type: 'main', minSize: 400 }
    ]
});
$().w2grid({
    name: 'senderGrid',
    columns: [
        { field: 'email', text: w2utils.lang('Email'), size: '50%' },
        { field: 'name', text: w2utils.lang('Name'), size: '50%'},
        { field: 'utmURL', hidden: true },
        { field: 'bimiSelector', hidden: true },
        { field: 'dkimSelector', hidden: true },
        { field: 'dkimKey', hidden: true },
        { field: 'dkimUse', hidden: true }
    ],
    method: 'GET',
    postData: { cmd:"get" },
    url: '/api/sender',
    onClick: function(event) {
        var grid = this;
        var form = w2ui.senderForm;
        event.onComplete = function () {
            var sel = grid.getSelection();
            if (sel.length === 1) {
                form.recid  = sel[0];
                form.record = $.extend(true, {}, grid.get(sel[0]));
                form.refresh();
            } else {
                form.clear();
            }
        }
    }
});
$().w2form({
    header: w2utils.lang('Edit record'),
    name: 'senderForm',
    fields: [
        { field: 'recid', type: 'text', html: { label: 'ID', attr: 'size="10" readonly' } },
        { field: 'name', type: 'text', html: { label: 'Name', attr: 'size="40" maxlength="40"' } },
        { field: 'email', type: 'email', required: true, html: { label: 'Email', attr: 'size="30"' } },
        { field: 'utmURL', type: 'text', html: { label: 'Utm url', attr: 'size="40" maxlength="100"' } },
        { field: 'bimiSelector', type: 'text', html: { label: 'BIMI Selector', attr: 'size="20" maxlength="20"' } },
        { field: 'dkimSelector', type: 'text', html: { label: 'DKIM Selector', attr: 'size="20" maxlength="20"' } },
        { field: 'dkimKey', type: 'textarea', html: { label: 'DKIM Private Key', attr: 'style="width: 420px; height: 280px"' } },
        { field: 'dkimUse', type: 'checkbox', html: { label: 'Use DKIM' } }
    ],
    actions: {
        Reset: function () {
            this.clear();
        },
        Save: function () {
            var errors = this.validate();
            if (errors.length > 0) return;
            var cmd;
            var i = this;
            if (i.recid === 0) {
                cmd = 'add'
            } else {
                cmd = 'save'
            }
            $.ajax({
                type: "POST",
                url: '/api/sender',
                dataType: "json",
                data: {"request":
                    JSON.stringify({
                        "cmd": cmd,
                        "id": cmd === 'save'?parseInt(i.record.recid):parseInt(w2ui['group'].getSelection()[0]),
                        "email": i.record.email,
                        "name": i.record.name,
                        "utmURL": i.record.utmURL,
                        "bimiSelector": i.record.bimiSelector,
                        "dkimSelector": i.record.dkimSelector,
                        "dkimKey": i.record.dkimKey,
                        "dkimUse": i.record.dkimUse
                    }
                )}
            }).done(function (data) {

                if (data['status'] === 'error') {
                    w2alert(w2utils.lang(data["message"]), w2utils.lang('Error'));
                } else {
                    if (i.recid === 0) {
                        i.record.recid = data["recid"];
                        w2ui.senderGrid.add($.extend(true, { recid: data["recid"] }, i.record));
                    } else {
                        w2ui.senderGrid.set(i.recid, i.record);
                    }
                    w2ui.senderGrid.selectNone();
                    i.clear();
                    refreshSenderList($('#campaignSenderId').data('selected').id);
                }
            });

        }
    }
});
// --- /Sender emails editor ---