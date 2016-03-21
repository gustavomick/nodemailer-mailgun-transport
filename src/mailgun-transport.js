/*jslint node: true */
'use strict';

var Mailgun = require('mailgun-js');
var packageData = require('../package.json');

module.exports = function (options) {
    return new MailgunTransport(options);
};

function MailgunTransport(options) {
    this.options = options || {};
    this.name = 'Mailgun';
    this.version = packageData.version;

    this.mailgun = Mailgun({
        apiKey: this.options.auth.api_key,
        domain: this.options.auth.domain || '',
        proxy: this.options.proxy || ''
    });
}

MailgunTransport.prototype.send = function send(mail, callback) {
    var mailData, a, b, aa, i, options;
    mailData = mail.data;
    // convert nodemailer attachments to mailgun-js attachements
    if (mailData.attachments) {
        aa = [];
        for (i in mailData.attachments) {
            a = mailData.attachments[i];
            b = new this.mailgun.Attachment({
                data        : a.path || undefined,
                filename    : a.filename || undefined,
                contentType : a.contentType || undefined,
                knownLength : a.knownLength || undefined
            });
            aa.push(b);
        }
        mailData.attachment = aa;
    }

    options = {
        type       : mailData.type,
        to         : mailData.to,
        from       : mailData.from,
        subject    : mailData.subject,
        text       : mailData.text,
        html       : mailData.html,
        attachment : mailData.attachment,
        inline     : mailData.inline
    };

    // BCC
    if (mailData.bcc) {
        options.bcc = mailData.bcc;
    }

    // Reply to
    if (mailData.replyTo) {
        options.h['Reply-To'] = mailData.replyTo;
    }

    // Test mode (still charged for api calls)
    if (mailData.testmode) {
        options.o.testmode = true;
    }

    // Tracking
    if (mailData.tracking) {
        options.o.tracking = true;
    }

    // Tracking clicks
    if (mailData.trackingClicks) {
        options.o['tracking-clicks'] = true;
    }

    // Tracking opens
    if (mailData.trackingOpens) {
        options.o['tracking-opens'] = true;
    }

    // Tags (maximum 3)
    if (mailData.tag) {
        options.o.tag = mailData.tag;
    }


    // DKIM
    if (mailData.dkim) {
        options.o.dkim = true;
    }

    // Require TLS
    if (mailData.requireTls) {
        options.o['require-tls'] = true;
    }

    this.mailgun.messages().send(options, callback);
};