const ContactsFormatter = function() {
    this.format = null;
};

ContactsFormatter.prototype = {
    setStrategy: function(format) {
        this.format = format;
    },

    getFormatted: function(contacts) {
        return this.format.perform(contacts);
    }
};

ContactFormatFlat = function() {
    this.perform = function(contacts) {

        const formattedContacts = [];

        for (let i = 0; i < contacts.length; i++) {

            const contact   = contacts[i];

            if (contact.name === null) {
                continue;   // Ignore empty contacts.
            }

            const firstName = contact.name.givenName || null;
            const lastName  = contact.name.familyName || null;
            const company     = contact.organizations !== null ? contact.organizations[0].name : null;
            let displayName = this.extractDisplayName(contact);

            if(displayName === null) {
                displayName = company;
            }

            if (contact.phoneNumbers !== null) {

                for (let j = 0; j < contact.phoneNumbers.length; j++) {

                    const phoneContactField = contact.phoneNumbers[j];
                    const type   = phoneContactField.type || null;
                    const number = phoneContactField.value.replace(' ', '');
                    const displayNameType = `${displayName}${type !== null ? ' (' + type + ')' : ''}`;
                    const displayNamePhone = `${displayName} (${number})`;
                    const displayNameTypePhone = `${displayName}${type !== null ? ' (' + type + ')' : ''} ${number}`;

                    const formattedContact = {
                        firstName: firstName,
                        lastName: lastName,
                        displayName: displayName,
                        type: type,
                        displayNameType: displayNameType,
                        displayNamePhone: displayNamePhone,
                        displayNameTypePhone: displayNameTypePhone,
                        phoneNumber: number,
                        company: company,
                        contactType: 'phone'
                    };

                    formattedContacts.push(formattedContact);
                }
            }

            if (contact.emails !== null) {
                for (let k = 0; k < contact.emails.length; k++) {

                    const emailContactField = contact.emails[k];
                    const type  = emailContactField.type || null;
                    const email = emailContactField.value;
                    const displayNameType = `${displayName}${type !== null ? ' (' + type + ')' : ''}`;
                    const displayNameEmail = `${displayName} (${email})`;
                    const displayNameTypeEmail = `${displayName}${type !== null ? ' (' + type + ')' : ''} ${email}`;

                    const formattedContact = {
                        firstName: firstName,
                        lastName: lastName,
                        displayName: displayName,
                        type: type,
                        displayNameType: displayNameType,
                        displayNameEmail: displayNameEmail,
                        displayNameTypeEmail: displayNameTypeEmail,
                        email: email,
                        company: company,
                        contactType: 'email'
                    };

                    formattedContacts.push(formattedContact);
                }
            }

        }

        return formattedContacts;
    };

    this.extractDisplayName = function(contact) {
        if (device.platform === 'iOS' && contact.name) {
            return contact.name.formatted;
        } else {
            return contact.displayName;
        }
    }
};

ContactFormatRaw = function() {
    this.perform = function(contacts) {
        return contacts;
    }
};

