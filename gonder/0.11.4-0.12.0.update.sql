ALTER TABLE `campaign` CHANGE `body` `template_html` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;
ALTER TABLE `campaign` ADD `template_text` MEDIUMTEXT NOT NULL DEFAULT '' AFTER `template_html`;