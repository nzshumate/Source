/*
*
* Module for parsing Source file tree data
*
* @author Robert Haritonov (http://rhr.me)
*
* */

//Getting always new version of navigation JSON
var fileTreeJson = 'text!/data/pages_tree.json?' + new Date().getTime();

define([
    'jquery',
    'modules/module',
    fileTreeJson], function ($, module, data) {

    function ParseFileTree() {
        this.json = $.parseJSON(data.toString());
    }


    /* наследуем от Module */
    ParseFileTree.prototype = module.createInstance();
    ParseFileTree.prototype.constructor = ParseFileTree;

    //getSpecificCat = a || [a,b] - Get only listed category, categories
    //getCatInfo = bool - Turn on cat info parsing
    ParseFileTree.prototype.parsePages = function (getSpecificCat, getCatInfo) {
        var _this = this,
            json = _this.json,
            getSpecificCat = getSpecificCat,
            fileTree = {},
            totalTree = {};

        var searchCat = function(currentCatObj, currentCat, toCheckCat) {
            for (var currentSubCat in currentCatObj) {
                var targetSubCatObj = currentCatObj[currentSubCat];

                if (typeof targetSubCatObj === 'object') {

                    //Need to collect only spec pages objects
                    if ( _this.checkCatInfo(targetSubCatObj, currentSubCat, getCatInfo) && _this.checkCat(currentCat, getSpecificCat, toCheckCat) ) {
                        //Checking if object is already there
                        if (typeof fileTree[currentSubCat] != 'object') {
                            fileTree[currentCat + '/' + currentSubCat] = targetSubCatObj;
                        }

                    } else {
                        //Going deeper

                        // complex/paths/handles/here
                        if ( (getSpecificCat !== undefined) && (getSpecificCat.indexOf('/') !== -1) ) {
							var getSpecificCatArr = getSpecificCat.split('/'),
								success = true;

                        	// absolute path
                        	if (getSpecificCat.indexOf('/') == 0) {
                        		returnedTreeObj = _this.json;

                        		for (var i = 1; i < getSpecificCatArr.length; i++) {

									returnedTreeObj = returnedTreeObj[ getSpecificCatArr[i] ];
                        		}

								for (innerCat in returnedTreeObj) {
									if ( _this.checkCatInfo(returnedTreeObj[innerCat]) ) {
										fileTree[innerCat] = returnedTreeObj[innerCat];
									}
								}

                        	} else {
                        		//relative path

								var	currentCheckCat = currentSubCat,
									returnedTreeObj = currentCatObj;

								for (var i = 0; i < getSpecificCatArr.length; i++) {
									if (_this.checkCat(currentCheckCat, getSpecificCatArr[i])) {
										currentCheckCat = getSpecificCatArr[i+1];
									} else {
										success = false;
										break;
									}

									returnedTreeObj = returnedTreeObj[ getSpecificCatArr[i] ];
								}

								if (success) {
									for (innerCat in returnedTreeObj) {
										if ( _this.checkCatInfo(returnedTreeObj[innerCat]) ) {
											fileTree[innerCat] = returnedTreeObj[innerCat];
											continue;
										}

										if ( _this.checkCatInfo(returnedTreeObj[innerCat], innerCat, true) ) {
											fileTree[innerCat] = returnedTreeObj;
										}
									}
								}


                        	}

                        } else if (_this.checkCat(currentCat, getSpecificCat, toCheckCat)) {
                            //Turn off cat checking in this process, to get all inner folders

                            //Except other cats in specific cat search mode
                            if (typeof getCatInfo !== 'undefined') {

                                // Checking navigation page info
                                if (typeof targetSubCatObj['index.html'] !== 'object' ) {
                                    searchCat(targetSubCatObj, currentSubCat, true);
                                }

                            } else {
                                searchCat(targetSubCatObj, currentSubCat, true);
                            }

                        } else {
                            searchCat(targetSubCatObj, currentSubCat);
                        }

                    }
                }
            }
        };

        //Parse first level folders
        for (var currentCat in json) {
            var currentCatObj = json[currentCat];

            //Go inside first level folders
            searchCat(currentCatObj, currentCat);

            totalTree = $.extend(totalTree, fileTree);
        }

        if (Object.getOwnPropertyNames(fileTree).length > 0) {
            return totalTree;
        }

    };

    ParseFileTree.prototype.checkCatInfo = function (targetSubCatObj, currentSubCat, getCatInfo) {
        //If cat info needed
        if (getCatInfo) {
            return typeof targetSubCatObj['index.html'] === 'object' || currentSubCat === 'index.html';
        } else {
            return typeof targetSubCatObj['index.html'] === 'object';
        }
    };

    ParseFileTree.prototype.checkCat = function (currentCat, getSpecificCat, toCheckCat) {
        var getSpecificCat = getSpecificCat,
            currentCat = currentCat,
            toCheckCat = toCheckCat;

        var checkCat = function() {

            //Multiple check cat support
            if (typeof getSpecificCat === 'string') {

                return getSpecificCat === currentCat;

            } else if (typeof getSpecificCat === 'object') { //If array

                var something = false;

                for (var i = 0; i < getSpecificCat.length; i++) {

                    if (getSpecificCat[i] === currentCat) {
                        something = true;

                        break;
                    }
                }

                return something;

            } else {
                return false;
            }
        };

        //Turn off cat checking in specific process
        if (toCheckCat === true) {
            return true;
        } else {
            //Check if cat checking is set
            if (typeof getSpecificCat != 'undefined') {
                return checkCat();
            } else {
                return true;
            }
        }
    };

    ParseFileTree.prototype.getAllPages = function () {
        //Get pages from all categories
        var fileTree = this.parsePages(),
        	fileFlat = {},
        	_this = this;

        var lookForIndexOrGoDeeper = function(tree) {
			for (folder in tree) {

				if (typeof tree[folder] === 'object') {
					if ( !_this.checkCatInfo(tree[folder]) ) {

							var fullPath = tree['index.html'].url.split('index.html')[0];
							fileFlat[fullPath] = tree;

					} else {
						lookForIndexOrGoDeeper( tree[folder] );
					}
				}
			}
        }

        lookForIndexOrGoDeeper(fileTree);
        return fileFlat;
    };

    ParseFileTree.prototype.getCatPages = function (getSpecificCat) {
        //Get cat pages
        return this.parsePages(getSpecificCat);
    };

    ParseFileTree.prototype.getCatAll = function (getSpecificCat) {
        //Get cat pages with cat info
        return this.parsePages(getSpecificCat, true);
    };

    return new ParseFileTree();
});