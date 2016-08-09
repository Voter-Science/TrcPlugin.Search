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
    private _opts : trc.PluginOptionsHelper;

    public constructor(sheet: trc.Sheet) {
        this._sheet = sheet; // Save for when we do Post
    }

    // Entry point called from brower. 
    public static BrowserEntry(
        sheet: trc.ISheetReference,
        opts : trc.IPluginOptions,
        next: () => void
    ): MyPlugin {
        var trcSheet = new trc.Sheet(sheet);
        var plugin = new MyPlugin(trcSheet);
        plugin._opts = trc.PluginOptionsHelper.New(opts, trcSheet);

        plugin.initAsync(next);
        return plugin;
    }   

    public initAsync(next: () => void): void {
        this._sheet.getInfo(info => {
            this._info = info;
            this._sheet.getSheetContents((data) => {
                this._data = data;
                this.resetUi();

                // if passed a recId, then do that for the initial filter
                var recId :string = this._opts.getStartupRecId();
                if (recId != null)
                {            
                    var recIds = this._data["RecId"];       
                    var result = trc.SheetContents.KeepRows(this._data, 
                        (rowIdx) => recIds[rowIdx] == recId );
                    
                    this.renderResult(result);
                }

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

        this.renderResult(result);
    }

    // Render filtered rows to html.
    private renderResult(result : trc.ISheetContents) : void {    
        var render = new html.RenderSheet("main", result);
        render.setColumnInfo(this._info.Columns);
        // render.setColumns(["RecId", "FirstName", "LastName"])
        render.setHtml("RecId", (iRow : number) => {
            var recId = result["RecId"][iRow];
            //return "jump to <b>" + recId+ "</b>";
            return "jump to <a href='" + this._opts.getGotoLinkRecId(recId) +"' _target='blank'>" + recId + "</a>";
        });
        render.render();

        $("#countMsg").html("Found <b>" + render.getCountRows() + "</b> row(s) matching criteria.");
    }

    private static norm(x: string): string {
        if (x == null || x == undefined || x.length == 0) {
            return null;
        }
        return x.toUpperCase();
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
        var result = trc.SheetContents.KeepRows(this._data,
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
