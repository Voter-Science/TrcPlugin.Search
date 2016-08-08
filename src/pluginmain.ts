// TypeScript
// JScript functions for BasicList.Html. 
// This calls TRC APIs and binds to specific HTML elements from the page.  

import * as trc from '../node_modules/trclib/trc2';
import * as html from '../node_modules/trclib/trchtml';

declare var $: any; // external definition for JQuery 

export class MyPlugin {
    private _sheet: trc.Sheet;
    private _data: trc.ISheetContents;
    private _info: trc.ISheetInfoResult;

    // Entry point called from brower. 
    public static BrowserEntry(sheet: trc.ISheetReference): MyPlugin {
        var trcSheet = new trc.Sheet(sheet);
        return new MyPlugin(trcSheet);
    }

    public constructor(sheet: trc.Sheet) {
        this._sheet = sheet; // Save for when we do Post

/*
        var result : trc.ISheetContents =  { };
        result["Alpha"] = ["A1", "A2"];
        result["Beta"] = ["B1", "B2"];
        result["Charlie"] = ["C1", "C2"];

        var render = new html.RenderSheetOptions(result);
        render.setColumns(["Alpha", "Charlie"]);

        render.setHtml("Alpha", (iRow : number) => {
            var recId = result["Alpha"][iRow];
            return "<b>" + recId+ "</b>";
        });
        render.renderSheet("main");
*/
    }

    public initAsync(next: () => void): void {
        this._sheet.getInfo(info => {
            this._info = info;
            this._sheet.getSheetContents((data) => {
                this._data = data;
                this.resetUi();
                next();
            });
        });
    }

    

    protected resetUi(): void {
        // clear previous results
        $('#main').empty();
        $("#startMsg").text(this._info.CountRecords + " total records.");
    }  
  
    // Button click handler
    public onSearch(): void {
        // Get criteria from UX
        var first = $("#First").val();
        var last = $("#Last").val();
        var city = $("#City").val();
        var zip = $("#Zip").val();

        // In-memory search 
        var result = this.search2(first, last, city, zip);

        // Render to sheet. 
        //MyPlugin.renderSheetToDiv(result, "main");
        var render = new html.RenderSheetOptions(result);
        render.setColumnInfo(this._info.Columns);
        // render.setColumns(["RecId", "FirstName", "LastName"])
        render.setHtml("RecId", (iRow : number) => {
            var recId = result["RecId"][iRow];
            return "jump to <b>" + recId+ "</b>";
        });
        render.renderSheet("main");

        $("#countMsg").html("Found <b>" + render.getCountRows() + "</b> row(s) matching criteria.");
    }

    private static norm(x: string): string {
        if (x == null || x == undefined || x.length == 0) {
            return null;
        }
        return x.toUpperCase();
    }

    // Put this in a common helper library $$$  
    // applies fpInclude on each row in source sheet. 
    // Returns a new sheet with same columns, but is a subset.  
    public static GetRows(
        source: trc.ISheetContents,
        fpInclude: (idx: number) => boolean)
        : trc.ISheetContents {
        var columnNames: string[] = [];
        var results: trc.ISheetContents = {};
        for (var columnName in source) {
            columnNames.push(columnName);
            results[columnName] = [];
        }

        var cRecId: string[] = source["RecId"];
        //for(var iRow  in cRecId)
        for (var iRow = 0; iRow < cRecId.length; iRow++) {
            var keepRow: boolean = fpInclude(iRow);
            if (keepRow) {
                for (var x in columnNames) {
                    var columnName = columnNames[x];
                    var val = source[columnName][iRow];
                    results[columnName].push(val)
                }
            }
        }
        return results;
    }

    // target is already normalized. other is not. 
    private static Mismatch(target : string, other: string) : boolean
    {
        if (target == null) {
            return false;
        }
        other = MyPlugin.norm(other); 
        return (other != target);
    }

    // Return the rows in _data that match the filter.  
    public search2(
        first: string,
        last: string,
        city: string,
        zip: string
    ): trc.ISheetContents {
        first = MyPlugin.norm(first);
        last = MyPlugin.norm(last);
        city = MyPlugin.norm(city);
        zip = MyPlugin.norm(zip);

        var cFirst = this._data["FirstName"];
        var cLast = this._data["LastName"];
        var cCity = this._data["City"];
        var cZip = this._data["Zip"];

        // $$$ Compare - if ends in "*", do a suffix match. 
        var result = MyPlugin.GetRows(this._data,
            (iRow) => {
                if (MyPlugin.Mismatch(last, cLast[iRow]))                
                {
                    return false;   
                }
                if (MyPlugin.Mismatch(first, cFirst[iRow]))
                {
                    return false;   
                }
                if (MyPlugin.Mismatch(city, cCity[iRow]))
                {
                    return false;   
                }
                if (MyPlugin.Mismatch(zip, cZip[iRow]))
                {
                    return false;   
                }
                return true;
            });

        return result;
    }
}
