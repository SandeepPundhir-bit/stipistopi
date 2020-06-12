﻿import { PageSelectorViewModel, pageSelectorRegisterWidget } from "./pageselector.js";
import { CredentialsPageViewModel, credentialsPageRegisterWidget } from "./credentialspage.js";
import { ResourcesPageViewModel, resourcesPageRegisterWidget } from "./resourcespage.js";
import { Backend } from "./backend.js";


function ComponentManager() {
    let self = this;
    self.widgets = ko.observableArray([]);
    self.all_loaded = ko.observable(false);
    let to_load = 4;
    //function has_loaded(widgetName) {
    //    let is_loaded = self.widgets().indexOf(widgetName) != -1;
    //    console.log("Checking if " + widgetName + " is loaded [read]: " + is_loaded);
    //    return is_loaded;
    //}
    self.has_loadeds = {};
    self.has_loaded = function (widgetName) {
        if (!(widgetName in self.has_loadeds)) {
            self.has_loadeds[widgetName] = ko.observable(false);
        }
        return self.has_loadeds[widgetName];
    };

    self.register_loaded = function (widgetName) {
        self.widgets().push(widgetName);
        console.log("Registered loading of " + widgetName);
        //console.log(self.widgets());
        if (widgetName in self.has_loadeds) {
            self.has_loadeds[widgetName](true);
        }
        to_load -= 1;
        if (to_load == 0)
            self.all_loaded(true);
    };
}

export function MainWindowViewModel() {
    this.backend = Backend();
    this.componentManager = ko.observable(new ComponentManager());
    this.mainContent = ko.observable();
    this.pageSelectorVm = new PageSelectorViewModel();
    this.credentialsPageVm = new CredentialsPageViewModel();
    this.resourcesPageVm = new ResourcesPageViewModel();
    // TODO Eliminate circular reference
    this.resourcesPageVm.main = this;
    this.pageSelectorVm.selected = this.mainContent;
}
