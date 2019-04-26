
# Mesa City Waste Management Analysis Interface

A map and graph interface that provides insight into activities of weekly waste collection.

## Before running

Make sure there's a 'data' directory available. In 'data/', there should be the following files and directories: 


* weeks/: This directory holds files of weekly collection. Names of these files would be used on the interface to refer to the files. For example: week1.csv will appear as "week1" on the interface. **Only csv(.csv) and excel (.xlsx) files will be process. Excel files with multiple workbooks will not be processed (in this case, separate each workbook into an excel and name them accordingly)**
* allcustomers.csv: This file holds data on all customers in all zones.
* MesaCityZones.dbf: This .dbf file is the database file for SHAPE files. It holds data on all zones. It will be processed along with MesaCityZones.shp.
* MesaCityZones.prj: This .prj file is the projection file for the coordinates specified in MesaCityZones.shp.
* MesaCityZones.shp: This .shp file is the SHAPE file for all zones.

______

## Run

- In terminal(mac)/Git Bash(windows), navigate to the directory where the project is.
>`cd path/to/project/`
- Start the program
>`npm start`

The program would first preprocess the files in 'data/' directory into 'data/json' directory. This preprocessing will only be done if 'data/json' directory is not present. Preprocessing may take a couple minutes depending on how big the files in 'data/' directory are.

_If there are missing values or parameters in the files during preprocessing, the program will continue if the missing values are not important otherwise it would stop. Warning messages will be printed for unimportant missing values._ 
___
## Preprocess
To run preprocessing without starting the program, run
>`npm prestart`

To rerun the preprocessing, delete the 'data/json/' directory and rerun the program. Otherwise, the preprocessing will ignore the rerun.
___
## Split multiple weeks

If there's a single file that holds data for multiple weeks, you can split that file up by running
>`npm run split 'multipleweeks.csv'` (or .xlsx for Excel file)
_change 'multipleweeks' to the name of the file_

This file must be in the 'data/' directory. The weeks will be added to 'data/weeks/' directory. The week names are in the format 'weekOf[month].[day]'
___
## Versioning
[Semantic Versioning](https://semver.org/) scheme is employed. v1.2.3 implies major version #1, minor version #2, feature upgrade #3.

--------
For further documentation, see inline jsdoc in the .js files.