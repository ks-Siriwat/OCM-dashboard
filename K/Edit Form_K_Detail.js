// FORM-K
window.$ = $;
window.fd = fd;
window.pnp = pnp;

window.userLogin = {
    Id: _spPageContextInfo.userId,
    DisplayName: _spPageContextInfo.userDisplayName,
    LoginName: _spPageContextInfo.userLoginName,
    Key: _spPageContextInfo.systemUserKey,
    Email: _spPageContextInfo.userEmail
}

window.NumberWithComma = function (input) {
    const userInput = input;
    // Remove any non-numeric characters except commas and periods
    const numericInput = userInput.replace(/[^\d,.]/g, '');

    // Check if the cleaned input is empty
    if (numericInput === '') {
        input = '0.00';
        // Clear the input field
    } else {
        // Format the numeric value with commas as thousands separators
        const formattedValue = formatNumberWithCommas(numericInput);

        // Update the input field with the formatted value
        input = formattedValue;

    }
}

window.formatNumberWithCommas = function (value, minD = 0, maxD = 3) {
    // Convert the value to a number and handle potential errors
    let numberValue;
    try {
        // Convert the value to a number and handle potential errors
        numberValue = parseFloat(value.replace(/,/g, ''));
    } catch (e) {
        return NaN
    }
    // Format the number with commas and two decimal places
    const formattedNumber = numberValue.toLocaleString('en-US', {
        minimumFractionDigits: minD,
        maximumFractionDigits: maxD
    });

    return formattedNumber;
};

window.ConvertToNumber = function (numWithComma) {
    let convertResult = numWithComma.replace(/,/g, "");
    if (convertResult == '') {
        return 0;
    }
    return Number(convertResult);
}

window.transformLocalStorageValue = function (value) {
    try {
        let falsyKeywords = ["null", "undefined", ""];
        if (!value || falsyKeywords.includes(value))
            return JSON.parse(value);

        let _dataParsed = JSON.parse(value);
        return _dataParsed;
    } catch (error) {
        return value;
    }
}

// REST API
window.getItemsFrom = async function (listName = null, condition = '') {
    if (!listName) {
        console.error('cannot get Item (listName is null)');
        return null;
    }
    return await pnp.sp.web.lists.getByTitle(listName).items.filter(condition)();
}

window.getItemByID = async function (listName = null, ID = null) {
    if (!listName) {
        console.error('cannot get Item (listName is null)');
        return null;
    } else if (!ID) {
        console.error(`cannot get Item from ${listName} (ID is null)`);
        return null;
    }
    return await pnp.sp.web.lists.getByTitle(listName).items.getById(ID)();
}

window.updateItemIn = async function (listName = null, ID = null, payload = null) {
    if (!listName) {
        console.error('cannot get Item (listName is null)');
        return null;
    } else if (!ID) {
        console.error(`cannot get Item from ${listName} (ID is null)`);
        return null;
    } else if (!payload) {
        console.error(`cannot update itemID ${ID} with payload: ${payload}`);
        return null;
    }
    return await pnp.sp.web.lists.getByTitle(listName).items.getById(ID).update(payload);
}

window.deleteItemIn = async function (listName = null, ID = null) {
    if (!listName) {
        console.error('cannot get Item (listName is null)');
        return null;
    } else if (!ID) {
        console.error(`cannot get Item from ${listName} (ID is null)`);
        return null;
    }
    return await pnp.sp.web.lists.getByTitle(listName).items.getById(ID).delete();
}

// END REST API

window.filterField = function (fieldName, condition = '', orderBy = null, isdesc = false) {
    fd.field(fieldName).filter = null;
    fd.field(fieldName).filter = condition;
    fd.field(fieldName).orderBy = { field: orderBy, desc: isdesc };
    fd.field(fieldName).refresh();
}; // End function filterField

window.filterControl = function (controlName, condition = '', orderBy = null, isdesc = false) {
    fd.control(controlName).filter;
    fd.control(controlName).filter = condition;
    fd.control(controlName).orderBy = { field: orderBy, desc: isdesc };
    fd.control(controlName).refresh();
}; // End function filterControl

window.sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.delay = function (callback, ms) {
    var timer = 0;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            callback.apply(context, args);
        }, ms || 0);
    };
}

fd.spBeforeRender(function () {
}); // End fd.spBeforeRender

fd.spRendered(async function () {
    $('.loading').show();
    // $('.fd-toolbar-primary-commands > button:first-child').css('display', 'none');
    var refs = fd.fields();
    refs.forEach(field => {
        if (field.$el.closest('.f-dis') != null)
            field.disabled = true;
    });

    //set Field Apperence
    await sleep(1_200);
    console.clear();
    /**************************ONLOAD*****************************/
    console.log("hi", userLogin.DisplayName || null);
    console.groupCollapsed('userLogin Detail');
    console.log("Id :", userLogin.Id || null);
    console.log("LoginName :", userLogin.LoginName || null);
    console.log("Key :", userLogin.Key || null);
    console.log("Email :", userLogin.Email || null);
    console.groupEnd('userLogin Detail');

    // convert to String (when open edit form)
    const fieldNumber = [
        'TotalWorkValue',
        'KvalueExcludeVat',
        'CalculatedCompensationExcludeVat',
        'Kvalue',
        'Deduct4pctRemaining'
    ]
    fieldNumber.forEach(field => {
        fd.field('Input' + field).value = formatNumberWithCommas(String(fd.field(field).value) || NaN)
    })


    const fieldNames = [
        { Name: 'InputTotalWorkValue', minD: 2, maxD: 2 },
        { Name: 'InputKvalueExcludeVat', minD: 2, maxD: 2 },
        { Name: 'InputCalculatedCompensationExcludeVat', minD: 2, maxD: 2 },
        { Name: 'InputKvalue', minD: 3, maxD: 3 },
        { Name: 'InputDeduct4pctRemaining', minD: 3, maxD: 3 }
    ];
    fieldNames.forEach(field => {
        var elem = $(fd.field(field.Name).$el).find('input');

        elem.on("focusin", function (event) {
            $(this).select();
        })

        elem.on("focusout", function (event) {
            const numericInput = fd.field(field.Name).value || '';

            // Check if the cleaned input is empty
            if (numericInput === '') {
                fd.field(field.Name).value = '0.00';
                // Clear the input field
            } else {
                // Format the numeric value with commas as thousands separators
                const formattedValue = formatNumberWithCommas(numericInput, field.minD, field.maxD);

                // Update the input field with the formatted value
                fd.field(field.Name).value = formattedValue;
                fd.field(field.Name.replace('Input', '')).value = ConvertToNumber(formattedValue);

            }
        });
    });

    /**************************ONCHANGE**************************/

    fd.field('Attachments').validators.push({
        name: 'Check Attachment',
        error: "Error text attachments",
        validate: function () {
            var atchsAr = fd.field('Attachments').value;
            for (i = 0; i < atchsAr.length; i++) {
                var ext = atchsAr[i].extension;
                if (ext != '.pdf') {
                    this.error = "Please upload a PDF document!"
                    return false;
                }
            }
            return true;
        }
    });

    $('.loading').fadeOut('slow');

}); // end fd.spRendered

fd.spBeforeSave(async function () {
}); // End fd.spBeforeSave

fd.spSaved(function (result) {
}); // End fd.spSaved