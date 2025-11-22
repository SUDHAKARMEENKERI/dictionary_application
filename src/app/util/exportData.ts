import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { WordListService } from '../service/word-list.service';
import { UserSignUpService } from '../service/user-signup.service';

export class ExportDataToExcel {
    constructor(private wordService: WordListService, private userService: UserSignUpService) { }

    exportToExcel(tableList: string, tableName: string): void {
        if (tableList === 'wordList') {
            this.wordService.fetchWords().subscribe(list => {
                if (list && list.length > 0) {
                    this.dowloadExcelFile(list, 'WordList');
                }
            });
        } else if (tableList === 'userList') {
            this.userService.getAllUsers().subscribe(list => {
                if (list && list.length > 0) {
                    this.dowloadExcelFile(list, 'UserList');
                }
            });
        }
    }

    dowloadExcelFile(tableData: any[], fileName: string): void {
            // Convert JSON to worksheet
            const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(tableData);

            // Create a workbook and add the worksheet
            const workbook: XLSX.WorkBook = {
                Sheets: { 'data': worksheet },
                SheetNames: ['data']
            };

            // Generate Excel file buffer
            const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            // Save file
            const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            saveAs(data, `${fileName}.xlsx`);
    }
}