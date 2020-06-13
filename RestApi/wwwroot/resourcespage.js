﻿import { AjaxLoad, AjaxPost, Noop } from "./util.js";
import { ResourceLineViewModel } from "./resourceline.js";


function ResourcesPageViewModel(backend) {
    let self = this;
    this.backend = backend;
    this.resources = ko.observableArray([]);

    function UpdateResourceList(resources) {
        self.resources(resources.map(function(resource) {
            let vm = ResourceLineViewModel.create(resource);
            vm.updateActions(self.backend, self.refresh);
            return vm;
        }));
    };

    this.refresh = function () {
        AjaxLoad("./stipistopi/resources", "json", UpdateResourceList, function () { });
    };
}

function resourcesPageRegisterWidget(template) {
    let widgetName = "resources-page-widget";
    ko.components.register(widgetName, {
        viewModel: function(params) {return params;},
        template: template,
    });
    return widgetName;
}

export { ResourcesPageViewModel, resourcesPageRegisterWidget };