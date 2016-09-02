/*jslint node: true */
'use strict';

var Mailgun = require('mailgun-js');
var packageData = require('../package.json');

module.exports = function (options) {
    return new MailgunTransport(options);
};

function prepareCustomVars(options, data) {
    if (Array.isArray(data)) {
        for (var key in data) {
            if ((typeof data[key] === 'object')) {
                for (var p in data[key]) {
                    if (data[key].hasOwnProperty(p)) {
                        options['v:' + p] = JSON.stringify(data[key]);
                    }
                }
            } else {
                options['v:' + data[key]] = data[key];
            }
        }
    }
    return options;
}

function prepareTags(options, data) {
    if (Array.isArray(data)) {
        options['o:tag'] = data
    }

    return options;
}

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
        subject    : mailData.subject,
        text       : mailData.text,
        html       : mailData.html,
        attachment : mailData.attachment,
        inline     : mailData.inline,
        o: {}
    };
    
    if (mailData.messageId) {
        options['h:Message-Id'] = mailData.messageId;
    }

    if (mailData.headers) {
        for (var header in mailData.headers) {
            options['h:' + header] = mailData.headers[header];
        }
    }

    if (typeof mailData.from === "object") {
        // 'From Name <from@example.com>'
        options.from = '"' + mailData.from.name + '" <' + mailData.from.address + '>';
    } else {
        options.from = mailData.from;
    }
    
    // Custom fields
    if (mailData.vars) {
        prepareCustomVars(options, mailData.vars);
    }

    // BCC
    if (mailData.bcc) {
        options.bcc = mailData.bcc;
    }

    // Reply to
    if (mailData.replyTo) {
        options['h:Reply-To'] = mailData.replyTo;
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
        prepareTags(options, mailData.tag);
        options.o['tag'] = mailData.tag2;
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
