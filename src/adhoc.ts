// adhoc command line driver for testing search 
// pass in a canvass code on the cmd line. 

import * as plugin from './pluginmain';
import * as trc from '../node_modules/trclib/trc2';

class PluginX extends plugin.MyPlugin
{
    // Stub out UI code
    protected resetUi(): void { }
    public updateInfo(info: trc.ISheetInfoResult): void { }

    public constructor(sheet: trc.Sheet)
    {
        super(sheet);
    }
} 

function failureFunc(statusCode : number) : void 
{
      console.log("*** failed with " + statusCode);
}



var loginUrl = "https://trc-login.voter-science.com";
declare var process: any;
var code = process.argv[2];

  trc.LoginClient.LoginWithCode(loginUrl, code,
        (sheet: trc.Sheet) => {
            console.log("Login successful...");

            var p = new PluginX(sheet);
            p.initAsync( ()=> 
            {  
                // Finished loading.... 
                console.log('begin search');

                var result = p.search2(null, 'Davis', null, null);
                console.log(JSON.stringify(result));
                console.log('done');
            });

        }, failureFunc
  );


/*

Next:
- use other fields in search (and ignore nulls) 
- render ISheetContents --> HTML  (another helper?)
    -Which columns to include?
    - Include a Link ()
    

- also do Bulk plugin and see what commonality we get.  

- 

*/