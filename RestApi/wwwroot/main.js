import { AjaxLoad, AjaxPost, Noop } from "./util.js";
import { TemplateManager } from "./templatemanager.js";
import { ResourceActions } from "./resourceactions.js";
import { MainWindowViewModel } from "./mainwindow.js";
import { PageSelectorViewModel, pageSelectorRegisterWidget } from "./pageselector.js";
import { PageSelectorItemViewModel } from "./pageselectoritem.js";
import { UnauthenticatedMainContentViewModel, unauthenticatedMainContentRegisterWidget } from "./credentialspage.js"

function Backend() {
    let myUser = {
        userName: "test",
        password: "test",
    };

    function sendResourceAction(action, resourceName, onSuccess) {
        let url = "./stipistopi/" + action;
        let lockParameter = {
            resourceName: resourceName,
            user: myUser,
        };
        AjaxPost(url, lockParameter, onSuccess, Noop)
    }

    function createUserAction(userName, password, role, onSuccess) {
        let newUserParameter = {
            user: { userName: userName, password: password, role: role },
            creator: myUser,
        };
        // TODO: on failure
        AjaxPost("./stipistopi/register", newUserParameter, onSuccess, Noop)
    }

    return {
        sendResourceAction: sendResourceAction,
        createUserAction: createUserAction,
    };
}

function StipiStopi(resourceActions, userActions, templateManager) {
    let backend = Backend();

    let stipistopi = {
        // Declarations of public methods, definitions will follow below
        /**
         * Called initially when all templates have been loaded
         * @param contents Hashmap of name -> content
         */
        OnTemplatesLoaded: contents => { },
        /**
         * Issue an ajax request to download resources
         */
        DownloadResourceList: () => { },
        /**
         * Issue an ajax request to download users
         */
        DownloadUserList: () => { },
    };

    function extendResource(resource) {
        function getMainAction(resource) {
            let label = resource.isAvailable ? "Lock" : "Release";
            let backendAction = resource.isAvailable ? "lock" : "release";
            let execute = function () {
                backend.sendResourceAction(backendAction, resource.shortName, stipistopi.DownloadResourceList);
            };

            return {
                label: label,
                backendAction: backendAction,
                execute: execute,
                id: -1,
            }
        };

        resource.actions = [getMainAction(resource)];
    }

    function UpdateResourceList(resources) {
        resources.forEach(extendResource);
        resourceActions.update(resources);

        // Update UI
        let resourceList = document.getElementById("resourceList");
        resourceList.innerHTML = templateManager.ApplyResourceListTemplate(resources);
        console.log("Setting resourceList inner html...");
        // console.log(resourceList.innerHTML);
        document.getElementById("buttonRefreshResourceList").addEventListener("click", stipistopi.DownloadResourceList);
    };

    function extendUser(user) {
        user.isEditing = false;
        user.actions = [{
            label: "Edit",
            execute: function() { console.log("TODO: toggle isEditing for the row"); },
            id: -1,
        }];
    }

    function UpdateUserList(users) {
        users.forEach(extendUser);
        let newUser = {
            userName: "",
            isEditing: true,
            roles: [
                { role: "Regular" },
                { role: "Admin" },
            ],
            actions: [{ 
                id: -1, 
                label: "Save", 
                execute: function() {
                    let newUserName = document.getElementById("userName").value;
                    let newUserPassword = document.getElementById("userPassword").value;
                    let newUserRole = document.getElementById("userRole").value;
                    backend.createUserAction(newUserName, newUserPassword, newUserRole, stipistopi.DownloadUserList);
                }
            }],
        };
        users.splice(0, 0, newUser);
        userActions.update(users);

        let userList = document.getElementById("userList");
        userList.innerHTML = templateManager.ApplyUserListTemplate(users);
        document.getElementById("buttonRefreshUserList").addEventListener("click", stipistopi.DownloadUserList);
    }

    function DownloadResourceList() {
        // TODO: on failure
        AjaxLoad("./stipistopi/resources", "json", UpdateResourceList, function () { });
    };

    function DownloadUserList() {
        // TODO: on failure
        AjaxPost("./stipistopi/users", { userName: "test", password: "test" }, UpdateUserList, function () { });
    }

    function OnTemplatesLoaded(contents) {
        console.log("Everything should be loaded by now...");
        // console.log(contents);
        templateManager.Load(contents);
        stipistopi.DownloadResourceList();
        stipistopi.DownloadUserList();
    };

    // Some methods need to be exposed
    stipistopi.OnTemplatesLoaded = OnTemplatesLoaded;
    stipistopi.DownloadResourceList = DownloadResourceList;
    stipistopi.DownloadUserList = DownloadUserList;

    return stipistopi;
}

function PageLoaded() {
    window.resourceActions = ResourceActions();
    // TODO Rename ResourceActions to ActionRegistry
    window.userActions = ResourceActions();
    console.log("window.resourceActions has been set");
    let templateManager = TemplateManager();
    let stipistopi = StipiStopi(window.resourceActions, window.userActions, templateManager);
    templateManager.LoadTemplates(stipistopi.OnTemplatesLoaded);
}

window.PageLoaded = function () {
}

let mainWindowVm = new MainWindowViewModel();
mainWindowVm.unauthenticatedMainContentVm.userName("prefill name");
mainWindowVm.authenticatedMainContentVm.userName("other one");

AjaxLoad("./unauthenticatedmaincontent.html", "text", function (content) {
    unauthenticatedMainContentRegisterWidget(content);
    let componentSelector = new PageSelectorItemViewModel(
        "Credentials",
        "unauthenticated-main-content-widget",
        mainWindowVm.unauthenticatedMainContentVm
    );
    componentSelector.activate = () => mainWindowVm.mainContent(componentSelector);
    mainWindowVm.pageSelector.add(componentSelector);
}, Noop);

AjaxLoad("./authenticatedmaincontent.html", "text", function (content) {
    let authenticatedMainContentWidget = {
        viewModel: UnauthenticatedMainContentViewModel,
        template: content,
    };

    ko.components.register("authenticated-main-content-widget", authenticatedMainContentWidget);
    let componentSelector = new PageSelectorItemViewModel(
        "Dummy",
        "authenticated-main-content-widget",
        mainWindowVm.authenticatedMainContentVm,
    );
    componentSelector.activate = () => mainWindowVm.mainContent(componentSelector);
    mainWindowVm.pageSelector.add(componentSelector);
}, Noop);


AjaxLoad("./pageselector.html", "text", function (content) {
    pageSelectorRegisterWidget(content);
    mainWindowVm.pageSelectorVm(mainWindowVm.pageSelector);
}, Noop);


ko.applyBindings(mainWindowVm);
