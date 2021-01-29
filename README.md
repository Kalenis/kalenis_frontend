![Alt text](http://kalenislims.com/img/isologo-kalenis.png)
# Kalenis LIMS Frontend

Kalenis frontend replace the list views provided by [Tryton SAO](https://github.com/tryton/sao), adding new features such as:

* **"Windowing" approach to get records**
* **Horizontal Scroll**
* **Manage columns: Add, remove and reorder columns**
* **Context Menu on right click (inspired on GTK client)**
* **Allow the user to change records quantity on the view**
* **Comfortable or compact view**
* **User Views Support:** Kalenis frontend depends on [Kalenis User View](https://github.com/Kalenis/kalenis_user_view) module, which is necessary for:
  * Create and save several views, including columns visibility, width & order, filters, order and records quantity.
  * Each view could be user specific or available to all users.
  * All of this operations are restricted by permissions, considering the following options:
    * **View Manager Active:** Allows the users to access to view manager options (Without this group, the user will have no access to view manager features)
    * **View Manager Editor:** Allows to create and edit views owned by the user
    * **View Manager Add Fields:** Allows to add fields (wich are not on the original view)
    * **View Manager Global:** Allow to create views available to all users.
    
# Supported Versions

Currently we support 5.4 and 5.6 Tryton versions.
    
# Getting started

* Install [Kalenis User View](https://github.com/Kalenis/kalenis_user_view) module, you could also use [pip](https://pypi.org/project/kalenis-user-view/):

`pip install kalenis_user_view`


* Get a "Ready to use" version from [here](https://downloads.kalenislims.com)

or

* Clone this repo and run ./install.sh from the "utils" folder. ( checkout the branch you need depending on your Tryton version)

In both cases, the section [web] of trytond.conf must be set to the directory "sao" created by the install process.


