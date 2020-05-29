function PageLoaded() {
    function DownloadTemplate(filename, loadAction) {
        let xhttp = new XMLHttpRequest();
        xhttp.responseType = "text";
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                console.log("Just loaded " + filename);
                console.log(xhttp);
                loadAction(xhttp.response);
            }
            // TODO or else?
        };
        xhttp.open("GET", filename, true);
        xhttp.send();
    }

    function LoadTemplates(templateFiles, loadAction) {
        let contents = {};
        let toLoadCount = templateFiles.length;
        templateFiles.forEach(function(fn) {
            let filename = fn;
            DownloadTemplate(filename, function(content) {
                contents[filename] = content;
                console.log("stored " + filename)
                toLoadCount -= 1;

                if (toLoadCount == 0)
                    loadAction(contents);
            });
        });
    }

    LoadTemplates(["resourceline.hbs", "resourcelist.hbs"], function(contents) {
        console.log("Everything should be loaded by now...");
        console.log(contents);
        Handlebars.registerPartial("resourceLineInList", contents["resourceline.hbs"]);
        let resourceListTemplate = Handlebars.compile(contents["resourcelist.hbs"]);

        var resourceActions = { actions: [] };
        resourceActions.execute = function (index) { resourceActions.actions[index].execute(); };
        resourceActions.clear = function () { resourceActions.actions = []; };
        resourceActions.create = function(label, fn) {
            let action = {label: label, execute: fn, id: resourceActions.actions.length};
            resourceActions.actions.push(action);
            return action;
        };
        window.resourceActions = resourceActions;
        console.log("window.resourceActions has been set");

        function SendResourceAction(action, resourceName) {
            let lockParameter = {
                resourceName: resourceName,
                user: {userName: "test", password: "test"},
            };

            let xhttp = new XMLHttpRequest();
            xhttp.responseType = "json";
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    DownloadResourceList();
                }
            };
            xhttp.open("POST", "./stipistopi/" + action);
            xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhttp.send(JSON.stringify(lockParameter));
        }

        let resourceList = document.getElementById("resourceList");
        console.log("resourceList identified: ")
        console.log(resourceList);

        function UpdateResourceList(resources) {
            resourceActions.clear();
            resources.forEach(resource => {
                let label = resource.isAvailable ? "Lock" : "Release";
                let resourceAction = resource.isAvailable ? "lock" : "release";
                let execute = function () { SendResourceAction(resourceAction, resource.shortName); };
                let action = resourceActions.create(
                    label,
                    execute
                    );
                resource.actions = [action];
            });
            resourceList.innerHTML = resourceListTemplate(resources);
            console.log("Setting resourceList inner html...");
            // console.log(resourceList.innerHTML);
            document.getElementById("buttonRefreshResourceList").addEventListener("click", DownloadResourceList);
        }

        UpdateResourceList([]);

        function DownloadResourceList() {
            let xhttp = new XMLHttpRequest();
            xhttp.responseType = "json";
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    UpdateResourceList(xhttp.response);
                }
                // TODO or else?
            }
            xhttp.open("GET", "./stipistopi/resources", true);
            xhttp.send();
        }
    });
}

// document.addEventListener("DOMContentLoaded", PageLoaded);
window.PageLoaded = PageLoaded;