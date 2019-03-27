# Mesa City Waste Management Analysis Interface

A map and graph interface that provides insight into activities of weekly waste collection.

## Before running

There are multiple files in 'data/' directory needed before running the program.
* weeks/: This directory holds files of weekly collection. Names of these files would be used on the interface to refer to the files. For example: week1.csv will appear as week1 on the interface. **Only csv(.csv) and excel (.xlsx) files will be process. Excel files with multiple workbooks will not be process (in this case, separate each workbook into an excel and name them accordingly)**
* allcustomers.csv: This file holds data on all customers in all zones.
* MesaCityZones.dbf: This .dbf file is the database file for SHAPE files. It holds data on all zones. It will be processed along with MesaCityZones.shp.
* MesaCityZones.prj: This .prj file is the projection file for the coordinates specified in MesaCityZones.shp.
* MesaCityZones.shp: This .shp file is the SHAPE file for all zones.

The program would first preprocess the files in 'data/' directory into 'data/json' directory. This preprocessing will only be done if 'data/json' directory is not present. Preprocessing may take a couple minutes depending on big the files in 'data/' directory are. _If there are missing values or parameters in the files during preprocessing, the program will continue if the values are not important otherwise it would stop. Warning messages will be printed for unimportant missing values._ 

## Run

The program can be started by running `npm start` in the Terminal(Mac) / Git Bash(Windows) at the directory where the program is.

--------
For further documentation, see inline jsdoc in the .js files.