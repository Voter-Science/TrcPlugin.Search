// HTML Helpers. Builds on JQuery 

declare var $: any; // external definition for JQuery

import * as trc from '../node_modules/trclib/trc2';

// Render a ISheetContents to HTML. 
// Includes various configuration options.  
export class RenderSheetOptions
{
    public constructor(data: trc.ISheetContents) {
        this._data = data;

        var columnNames: string[] = [];        
        for (var columnName in this._data) {
            columnNames.push(columnName);
        }
        this._onlyColumns = columnNames;        

        var cFirstColumn = this._data[columnNames[0]];
        this._numRows = cFirstColumn.length;

        this._tableHtml = "<table border=1>";
    }

    // Required - set in ctor.
    // Raw data sheet that's being rendered.
    private _data: trc.ISheetContents;

    // count of rows in _data 
    private _numRows : number;

    public getCountRows() : number {
        return this._numRows;
    }

    // Optional. Column infos.
    // - Can provide Display name. 
    // - for editable controls, can render a specific control based on column type 
    private _columnInfo : trc.IColumnInfo[];

    public setColumnInfo(columnInfo : trc.IColumnInfo[]) : void {
        this._columnInfo = columnInfo;
    } 

    // Column headers toinclude
    private _onlyColumns : string[];

    // Set which columns to display, and ordering.  
    // If this includes columns not in the original data set, then use setHtml to add a renderer.
    public setColumns(columnNames : string[]) : void {
        this._onlyColumns = columnNames;
    }

    // Optional HTML render function for each column
    // If missing, use the default. 
    private _columnRenderer : any = {};

    public setHtml(columnName : string, fpRenderer : (iRow : number) => string)
    {
        this._columnRenderer[columnName] = fpRenderer;
    }

    // Default table tag. Override this to apply styling, etc.
    // Set to a <table> element.   
    private _tableHtml : string;
    
    public setTableHtmlTag(tableHtml : string) : void {
        this._tableHtml = tableHtml;
    } 

    private getRenderer(columnName : string) : (iRow : number) => string {
        var fp = this._columnRenderer[columnName];
        if (fp == undefined)
        {        
            return null;
        }
        return fp;
    }

    // null if not found
    private getColumnInfo(columnName : string) : trc.IColumnInfo
    {
        if (this._columnInfo == null) {
            return null;
        }
        for(var i = 0; i < this._columnInfo.length; i++) {
            var ci = this._columnInfo[i];
            if (ci.Name == columnName) {
                return ci;
            }
        }
        return null;
    }

    // Main worker function. 
    // Call this after the various set*() methods are called to configure this.
    public renderSheet(
        divName: string
    ) {
        $('#main').empty();

        var table = $(this._tableHtml);
        $("#main").append(table);

        // Write header
        {
            var t = $('<thead>').append($('<tr>'));
            for (var iColumn = 0; iColumn < this._onlyColumns.length; iColumn++) {
                var columnName = this._onlyColumns[iColumn];
                var displayName = columnName; 

                // If we have a columnInfo, then check getting display name from that.
                if (this._columnInfo != null)
                {
                    var columnInfo = this.getColumnInfo(columnName);
                    if (columnInfo != null) {
                        if (columnInfo.DisplayName != null) {
                            displayName = columnInfo.DisplayName;
                        }
                    }
                } 

                var tCell1 = $('<td>').text(displayName);
                t = t.append(tCell1);
            }
            table.append(t);
        }

        // Write each rows
        for (var iRow = 0; iRow < this._numRows; iRow++) {

            var t = $('<tr>');
            for (var iColumn = 0; iColumn < this._onlyColumns.length; iColumn++) {
                var columnName = this._onlyColumns[iColumn];

                var fp = this.getRenderer(columnName);                
                if (fp == null) 
                {
                    // No renderer. Get value from contents and set as text.
                    var columnData = this._data[columnName];
                    var value = columnData[iRow];

                    var tcell = $('<td>').text(value);
                }
                else 
                {
                    // Invoke customer renderer to get HTML.
                    var html = fp(iRow);
                    var tcell = $('<td>').html(html);
                }

                t = t.append(tcell);
            }
            table.append(t);
        } // end each row    
    } // end func
}