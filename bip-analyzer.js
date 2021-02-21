
const btnclick = document.getElementById('checkFilesButton');
const XLSX = require('xlsx')
const ipc = require('electron').ipcRenderer;
var FileSaver = require('file-saver')



function s2ab(s) { 
    var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
    var view = new Uint8Array(buf);  //create uint8array as viewer
    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
    return buf;    
}

btnclick.addEventListener('click', async function () {
    try {
        const file1 = document.getElementById('file1').files[0].path;
        const file2 = document.getElementById('file2').files[0].path;
        let contagemTotal = 0;

        ipc.send('show-progressbar');

        if(!file1){
            ipc.send('set-progressbar-aborted');
            new Notification('Atenção', {
                body: 'Selecione corretamento o arquivo do cliente'
            });
            return;
        }

        if(!file2){
            ipc.send('set-progressbar-aborted');
            new Notification('Atenção', {
                body: 'Selecione corretamento o arquivo que foi feito o inventario'
            });
            return;
        }

        let workbook = XLSX.read(file1, { type: 'file' });
        let [firstSheetName] = workbook.SheetNames;
        let worksheet = workbook.Sheets[firstSheetName];

        let rowsClient = await XLSX.utils.sheet_to_json(worksheet, {
            raw: true, // Use raw values (true) or formatted strings (false)
            header: 1, // Generate an array of arrays ("2D Array")
        });

        workbook = XLSX.read(file2, { type: 'file' });
        [firstSheetName] = workbook.SheetNames;
        worksheet = workbook.Sheets[firstSheetName];

        const rowsBip = await XLSX.utils.sheet_to_json(worksheet, {
            raw: true, // Use raw values (true) or formatted strings (false)
            header: 1, // Generate an array of arrays ("2D Array")
        });

        for (let index = 0; index < rowsClient.length; index++) {
            if(index == 0){
                rowsClient[index][6] = 'Contabilizados';
                rowsClient[index][7] = 'Diferença';
                continue;
            } if (index == 1){
                continue;
            } else {

                let achei = false;
                let contabilizacaoRepetida = 0;

                for (let jotex = 0; jotex < rowsBip.length; jotex++) {    

                    if(jotex == 0){
                        continue;
                    } else {
                        if(rowsBip[jotex][0] == rowsClient[index][3] || rowsBip[jotex][0] == rowsClient[index][0]){
                            
                            contagemTotal += rowsBip[jotex][2];
                            contabilizacaoRepetida += rowsBip[jotex][2];
                            rowsClient[index][6] = contabilizacaoRepetida;
                            if(rowsClient[index][5] >= 0){
                                rowsClient[index][7] = contabilizacaoRepetida - rowsClient[index][5];
                            } else {
                                rowsClient[index][7] = rowsClient[index][5] + contabilizacaoRepetida;
                            }
                            achei = true;
                        
                            //break;
                        }
                    }
                }

                if(!achei){
                    rowsClient[index][6] = 0;
                    rowsClient[index][7] = rowsClient[index][5];
                }
            }


        }

        rowsClient[1][6] = contagemTotal;

        workbook = XLSX.utils.book_new();
        workbook.Props = {
            Title: "Resultado Inventário",
            Subject: "Test",
            Author: "BIP",
            CreatedDate: new Date()
        };

        workbook.SheetNames.push("Averiguacao");

        workbook.Sheets["Averiguacao"] = XLSX.utils.aoa_to_sheet(rowsClient);

       /* var sheet = workbook.Sheets[workbook.SheetNames[0]];

        Object.keys(sheet).forEach(function(s) {
            if(sheet[s].w) {
                delete sheet[s].w;
                sheet[s].z = '0';
            }
        });

        /*Object.keys(workbook).forEach(function(s) {
            if(workbook[s].t === 'n') {
                workbook[s].z = '0';
                workbook[s].t = 's';
            }
        });
        for (i = 2; i <= sheet.length; i++) {
            sheet["H"+i].s = {
                fill: {
                    patternType: "solid",
                    fgColor: { rgb: "ff3300" }
                    }
                };
        }*/

        var wbout = XLSX.write(workbook, {bookType:'xlsx', bookSST:false ,  type: 'binary'});

        FileSaver.saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'Resultado.xlsx');

        new Notification('Suuuuuuucesso', {
            body: 'Batimento finalizado'
        });

    } catch (e){
        console.log(e);
        ipc.send('set-progressbar-aborted');
        new Notification('Atenção', {
            body: 'Não consegui terminar o processo, chame meu criador' + e
        });
    } finally {
        ipc.send('set-progressbar-completed');

    }
});

