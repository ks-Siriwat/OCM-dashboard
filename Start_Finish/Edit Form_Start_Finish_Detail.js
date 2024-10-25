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
window.getItemsFrom = async function (listName = null, condition = '', orderBy = 'ID') {
    if (!listName) {
        console.error('cannot get Item (listName is null)');
        return null;
    }
    return await pnp.sp.web.lists.getByTitle(listName).items.filter(condition).orderBy(orderBy, true)();
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

    /**************************ONCHANGE**************************/

    function cal_ConstructDurationDays() {
        let start_Construction = fd.field('SF_ContractStartDate').value || null;
        let end_Construction = fd.field('SF_ContractEndDate').value || null;

        // Check for null values
        if (start_Construction == null || end_Construction == null) {
            return -1;
        }

        // Convert to Date objects
        let startDate = new Date(start_Construction);
        let endDate = new Date(end_Construction);

        // Calculate the difference in milliseconds
        let diffTime = endDate - startDate;

        // Convert milliseconds to days
        let ConstructDurationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Round up to include partial days

        return ConstructDurationDays + 1;
    }


    // onChange
    fd.field('SF_ContractStartDate').$on('change', function () {
        fd.field('SF_ConstructionDurationDays').value = cal_ConstructDurationDays();
    });

    fd.field('SF_ContractEndDate').$on('change', function () {
        fd.field('SF_ConstructionDurationDays').value = cal_ConstructDurationDays();
    });

    async function cal_ConstructionExtensionDays() {
        let recent_End_Date = await getItemsFrom('Form_Start_Finish_Detail', `SF_JobCode eq '${fd.field('SF_JobCode').value}' and SF_OrdinalNum lt ${fd.field('SF_OrdinalNum').value}`, 'SF_UpdateCount')
            .then(res => {
                if (res.length == 0)
                    return null;

                let lastIndex = res.length - 1;
                let recent_End_Construction_Date = res[lastIndex]['SF_ContractEndDate'];
                return recent_End_Construction_Date;
            })

        let previousEndConstructionDay = recent_End_Date;
        let currentEndConstructionDay = fd.field('SF_ContractEndDate').value || null;

        // Check for null values
        if (previousEndConstructionDay == null) {
            return 0;
        } else if (currentEndConstructionDay == null)
            return -1;

        // Convert to Date objects
        previousEndConstructionDay = new Date(previousEndConstructionDay);
        currentEndConstructionDay = new Date(currentEndConstructionDay);

        // Calculate the difference in milliseconds
        let diffTime = previousEndConstructionDay - currentEndConstructionDay;

        // Convert milliseconds to days
        let ExtensionDays = Math.abs(Math.round(diffTime / (1000 * 60 * 60 * 24))); // Round up and abs to include partial days
        return ExtensionDays;
    }

    // api cal
    fd.field('SF_ConstructionDurationDays').$on('change', async function () {
        console.log('construct duration changed');
        let ExtensionDays = await cal_ConstructionExtensionDays();
        fd.field('SF_ConstructionExtensionDays').value = ExtensionDays;
    })

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