#!/usr/bin/env node

const execFile = require("child_process").execFile;
const pandoc = require("pandoc-bin").path;
const fs = require("fs");
const path = require("path");
const ncp = require('ncp').ncp;

const package = require("./package.json");

let settings;
async function getSettings () {
    return new Promise((resolve, reject) => {
        if (settings) {
            resolve(settings);
        }
        else {
            fs.readFile("./package.json", (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    data = JSON.parse(data);

                    settings = data.doit || {
                        author: data.author
                    };

                    resolve(settings);
                }
            });
        }
    });
}

function genFile(source, dest, resources) {
    execFile(pandoc, ["--self-contained", "-o", dest, source], function (err, stdout, stderr) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("file generated!");
        }
    });    
}

function readDescription (filePath, filename) {
    return new Promise((resolve, reject) => {
        fs.open(filePath, 'wx', async (err, fd) => {
            if (err) {
                if (err.code === 'EEXIST') {
                    fs.readFile(filePath, (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(JSON.parse(data));
                        }
                    });
                }
                else {
                    reject(err);
                }
            }
            else {
                const {author} = await getSettings();
                const index = filename.indexOf(".");
                let title = filename;
                
                if (index > 0) {
                    title = title.substring(0, index);
                }

                const data = {
                    author,
                    date: new Date().toISOString(),
                    title
                };

                fs.write(fd, JSON.stringify(data), (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            }
        });
    });
}


function getFileModificationDate (filePath) {
    return new Promise((resolve) => {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                resolve(0);
            }
            else {
                resolve(new Date(stats.mtime).getTime());
            }
        });
    })
}

async function doUpdate (
    sourceFile,
    descriptionFile,
    destinationFile
) {
    sourceFileDate = await getFileModificationDate(sourceFile);
    descriptionFileDate = await getFileModificationDate(descriptionFile);
    destinationFileDate = await getFileModificationDate(destinationFile);

    return sourceFileDate > destinationFileDate || descriptionFileDate > destinationFileDate;
}

async function lstat (filename, filepath) {
    return new Promise((resolve, reject) => {
        fs.lstat(filepath,
            (err, stats) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        filename,
                        filepath,
                        isDirectory: stats.isDirectory()
                    });
                }
            }
        );
    });
}

async function readdir (folder) {
    return new Promise((resolve, reject) => 
        fs.readdir(folder, async (err, files) => {
            if (err) {
                reject(err);
            }
            else {

                const r = [];
                for (let i=0; i<files.length; i++) {
                    const filename = files[i];
                    const filepath = path.join(folder, filename);

                    const f = await lstat(filename, filepath);
                    r.push(f);
                }
                
                resolve(r);
            }
        })
    );
}

async function cleanUp (dbJSON, destination) {
    const files = (await readdir(destination)).map(f => path.join(destination, f.filename));

    const dbFiles = dbJSON.pages.concat(dbJSON.posts).map(v => v.url);

    const delFiles = files.filter(filename => !filename.endsWith(".json") && !dbFiles.includes(filename));
    
    for (let i=0; i<delFiles.length; i++) {
        const delFile = delFiles[i];

        fs.unlink(delFile, err => {
            if (err) {
                console.log("Unable to delete file " + delFile);
            }
            else {
                console.log("File " + delFile + " deleted.");
            }
        });
    }
}

async function doit (source, destination) {

    const dest = path.join(destination, "gen");

    const dbJSON = {
        pages: [],
        posts: []
    };

    for (type in dbJSON) {
        const folder = path.join(source, type);
        let list = dbJSON[type];

        const files = await readdir(folder);

        for (let i=0; i<files.length; i++) {
            const file = files[i];

            if (!file.filename.endsWith(".json")) {
                let sourceFile = path.join(folder, file.filename);
                const descriptionFile = sourceFile + ".json";

				let resources = ".";
                if (file.isDirectory) {
                    const dfiles = await readdir(sourceFile);
                    const index = dfiles.filter(f => !f.isDirectory && f.filename.startsWith("index."));

                    if (index.length === 0) {
                        throw "Can't find index on folder : " + sourceFile;
                    }

					resources = sourceFile;
                    sourceFile = path.join(sourceFile, index[0].filename);
                }
    

                const destinationFile = path.join(dest, file.filename + ".html");
    
                if (await doUpdate(
                    sourceFile,
                    descriptionFile,
                    destinationFile
                )) {
                    genFile(sourceFile, destinationFile, resources);
                }

                // always generate db json file.
                const description = await readDescription(descriptionFile, file.filename);
                list.push({
                    ...description,
                    url: destinationFile
                });
            }
        }

        list.sort(({date: dateA}, {date: dateB}) => new Date(dateB).getTime() - new Date(dateA).getTime());
    }

    fs.writeFile(path.join(dest, "db.json"), JSON.stringify(dbJSON), err => console.log(err?err:"done!"));

    return {dbJSON, dest};
}

// doit();

function init (source, folder) {
    if (folder) {
        fs.mkdir(folder, (err) => {
            if (err) {
				console.log("can't do it, can't create folder " + folder + ". " + err);
            }
            else {
				ncp.limit = 16;
                    
                ncp(source, folder, function (err) {
					if (err) {
						return console.error(err);
                    }

					console.log('done it!');
				});
             }
        });
    }
    else {
        printHelp();
    }
}

async function update (folder) {
    try {
        folder = folder || ".";
        const {dbJSON, dest} = await doit(path.join(folder, "sources"), folder);
        cleanUp(dbJSON, dest);
    }
    catch (e) {
        console.log(e);
    }
}

function printHelp () {
    const name = package.name;

    console.log(
        "You are not doing it, do it:\n" +
            "\t" + name + " init <folderName>\n" +
                "\t\t Creates a <folderName> to start bloging\n" +
                "\t\t ex. " + name + " init docs\n" +
            "\t" + name + " update [folderName]\n" +
                "\t\tUpdates your blog!!\n" +
                "\t\tUpdates your [folderName] is optional!!\n" +
                "\t\ex. " + name + " update docs\n" +
                "\t\ex. " + name + " update\n" +
        "Just do it!!"
    );
}

const argv = process.argv;

const cmd = argv[2];

switch (cmd) {
    case "init": init(path.join(__dirname, "docs"), argv[3]); break;
    case "update": update(argv[3]); break;
    case undefined: printHelp();
}
