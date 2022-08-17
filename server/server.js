const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

app.use(express.json());

const isWantedFile = (fileName, wantedExtension) => fileName.split(".")[1] === wantedExtension;
const getFileNames = (dataDestination, wantedExtension) => {
    const files = fs.readdirSync(dataDestination);
    return files.filter(fileName => isWantedFile(fileName, wantedExtension));
}

const getSingleCoverData = (dataDestination) => {
    const filesToCorrect = getFileNames(dataDestination, "dat");
    const dataToCorrect = filesToCorrect.map(fileName => fs.readFileSync(`${dataDestination}\\${fileName}`, 'utf-8'))
    return dataToCorrect.map((data, index) => index === 0 ? data : data.replace('<COVER>', ''));
}

const createFile = fileName => {
    fs.writeFileSync(fileName, "", err => {
        if (err)
            throw err;
    })
}

const writeDataToFile = (data, fileName) => {
    data.forEach(d => fs.appendFileSync(fileName, d, err => {
        if (err)
            throw err;
    }))
}

const cleanFileName = (fileName, fileDestination) => {
    fileName = fileName.split(".")[0]; // Drop any file extensions
    const fileDirectory = `${fileDestination}\\${fileName}.dat`;
    return fileDirectory;
}

const createMergedFile = (fileName, fileDestination, fileData) => {
    const fileDirectory = cleanFileName(fileName, fileDestination);
    createFile(fileDirectory);
    writeDataToFile(fileData, fileDirectory);
}

const mergeFiles = (fileName, fileDestination, dataDestination) => {
    const correctedData = getSingleCoverData(dataDestination);
    if (correctedData.length === 0) {
        throw "The data directory doesn't contain .dat files to merge."
    }
    createMergedFile(fileName, fileDestination, correctedData);
}

app.get("/api/:fileName/:fileDir/:dataDir", (req, res) => {
    let { fileName, fileDir, dataDir } = req.params;
    // Restore the directories to have the proper path location names
    fileDir = fileDir.replaceAll("Z", "\\");
    dataDir = dataDir.replaceAll("Z", "\\");

    try {
        mergeFiles(fileName, fileDir, dataDir);
    }
    catch (err) {
        console.log(err);
        res.json({status: `The job has failed, due to the following error:\n${err}`})
    }
    console.log(`${fileName}.dat created`)
    res.json({status: `${fileName}.dat has been created`})
})
app.get("/api/directory/:currentDirectory", (req, res) => {
    let { currentDirectory } = req.params;
    let directoryTree = currentDirectory.split("Z");
    const searchParam = directoryTree.pop();
    currentDirectory = directoryTree.join("\\");
    const childDirectories = fs.readdirSync(currentDirectory)
                                .map(file => path.join(currentDirectory, file))
                                .filter(path => fs.statSync(path).isDirectory())
                                .map(dir => dir.toString())
                                .filter(dir => dir.split("\\").slice(-1)[0].includes(searchParam));
    res.json({directories: childDirectories});
    
})

app.listen(5000, () => console.log("Server starting on port 5000"));