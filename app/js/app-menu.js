'use strict';

var path = require('path');
var constants = require('./constants');
var remote = require('remote');
var Menu = remote.require('menu');
var dialog = remote.require('dialog');
var ipc = require('ipc'); // used for close-window and other commands

//http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

module.exports = {
	getMenuTemplate: function() {
		var self = this;

		var template = [
			{
				label: 'File',
				submenu: [
					{
						label: 'Open File',
						accelerator: 'CmdOrCtrl+O',
						click: function() {
							dialog.showOpenDialog({
									properties: [
										'openFile'
									],
									filters: [
										{
											name: 'Images',
											extensions: constants.SupportedImageExtensions	
										}
									]
								},
								function(fileName) {
									if(fileName && self.options.onFileOpen) {
										self.options.onFileOpen(fileName);
									}
								});
						}
					},
					{
						label: 'Open Directory',
						click: function() {
							dialog.showOpenDialog({
									properties: [
										'openDirectory'
									]
								},
								function(dirName) {
									if(dirName && self.options.onDirOpen) {
										self.options.onDirOpen(dirName);
									}
								});
						}
					},
					{
						label: 'Make a copy',
						accelerator: 'CmdOrCtrl+S',
						click: function() {
							var currentFile = self.options.getCurrentFile();
							var selectedFileName = path.basename(currentFile);
							var ext = (path.extname(currentFile) + '').slice(1);
							dialog.showSaveDialog({
								title: 'Save as...',
								defaultPath: currentFile,
								filters: [{
									name: selectedFileName,
									extensions: [ ext ]
								}]
							}, function(fileName) {								
							    if (fileName === undefined) return;
							    copyFile(currentFile, fileName, function(err) {
									if (err) {
										return dialog.showErrorBox("File Save Error", err.message);
							     	}
							    });
							});
						}
					},
					{
						label: 'Delete',
						click: function() {
							var currentFile = self.options.getCurrentFile();

							fs.unlink(currentFile, function(err) {
								if(err) {
									return dialog.showErrorBox("File Delete Error", err.message);
								}

								self.options.onFileDelete();
							});
						}
					},
					{
						label: 'Quit',
						accelerator: 'CmdOrCtrl+Q',
						click: function() {
							ipc.send('close-main-window');
						}
					}
				]
			},
			{
				label: 'Help',
				submenu: [
					{
						label: 'About'
					}
				]
			}
		];
		return template;
	},

	initialize: function(options) {
		this.options = options;

		var template = this.getMenuTemplate();
		var menu = Menu.buildFromTemplate(template);

		Menu.setApplicationMenu(menu);		
	}
};