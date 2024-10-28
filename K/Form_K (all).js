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
    $('.fd-toolbar-primary-commands > button:first-child').css('display', 'none');
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

    const filterDataTable = (controlName) => {
        fd.control(controlName).filter = `<Eq><FieldRef Name="JobCode"/><Value Type="Text">${fd.control('ProjectCode').value?.LookupValue || null}</Value></Eq>`;
        fd.control(controlName).refresh();
    }

    const ProjectCodeBehavior = async (fieldValue) => {
        if (fieldValue) {
            fd.control('Form_K_Detail').buttons[0].disabled = false;
            var fetchedSelectedProject;
            try {
                fetchedSelectedProject = await getItemsFrom('DepartmentList', `DeptID eq '${fieldValue.LookupValue}'`)
                    .then(res => {
                        if (res.length === 0)
                            return null;
                        return res[0];
                    });
            } catch (error) {
                console.log("fetched ProjectCode error return null");
                console.error(error);
                fetchedSelectedProject = null;
            }
            fd.field('ProjectName').value = fetchedSelectedProject.DeptDisplay;
            localStorage.setItem('Form_K/JobCode', JSON.stringify(fieldValue.LookupValue));
        } else {
            fd.control('Form_K_Detail').buttons[0].disabled = true;

            fd.field('ProjectName').value = null;
            localStorage.setItem('Form_K/JobCode', JSON.stringify(null));
        }

        filterDataTable("Form_K_Detail");
    }
    fd.control('ProjectCode').ready(async function () {
        filterControl('ProjectCode', `MemberNameId eq ${userLogin.Id}`, 'DeptName');
        await ProjectCodeBehavior(this.value);
    });
    fd.control('ProjectCode').$on('change', async function () {
        await ProjectCodeBehavior(this.value);
    })

    /**************************ONCHANGE**************************/
    fd.control('Form_K_Detail').dialogOptions = {
        width: 1280,
        height: 720
    }
    // fd.control('Form_K_Detail').buttons[2].disabled = true;

    fd.control('Form_K_Detail').$on('change', async function (changedRow) {
        // if (changedRow.type === 'add') {
        //     await updateItemIn('Form_K_Detail', changedRow.itemId, {
        //         JobCode: fd.control('ProjectCode').value.LookupValue
        //     }).then(_ => filterDataTable("Form_K_Detail"));

        // }
    })

    fd.control('Form_K_Detail').templates = {
        CalculatedCompensationExcludeVat: function (ctx) {
            const value = ctx.row.CalculatedCompensationExcludeVat;
            if (value.includes('-'))
                return `<span style="color:#FF0000">${value}</span>`;
            return `<span>${value}</span>`;
        },
        TotalWorkValue: function (ctx) {
            const value = ctx.row.TotalWorkValue;
            if (value.includes('-'))
                return `<span style="color:#FF0000">${value}</span>`;
            return `<span>${value}</span>`;
        },
        KvalueExcludeVat: function (ctx) {
            const value = ctx.row.KvalueExcludeVat;
            if (value.includes('-'))
                return `<span style="color:#FF0000">${value}</span>`;
            return `<span>${value}</span>`;
        },
        Remark: function (ctx) {
            const value = ctx.row.Remark;
            return `<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: inherit; display: block;">${value}</span>`;
        }
    }


    $('.loading').fadeOut('slow');

}); // end fd.spRendered

fd.spBeforeSave(async function () {
}); // End fd.spBeforeSave

fd.spSaved(function (result) {
}); // End fd.spSaved