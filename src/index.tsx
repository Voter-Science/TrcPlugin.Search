import * as React from "react";
import * as ReactDOM from "react-dom";

import * as XC from 'trc-httpshim/xclient'
import * as common from 'trc-httpshim/common'
import * as core from 'trc-core/core'
import * as trcSheet from 'trc-sheet/sheet'

import { SheetContainer, IMajorState } from 'trc-react/dist/SheetContainer'
import { FieldInputs } from './components/FieldInputs'
import { ColumnNames, ISheetContents, SheetContents } from "trc-sheet/sheetContents";

import * as bcl from 'trc-analyze/collections'
import { PluginLink } from "trc-react/dist/PluginLink";
import { CsvMatchInput } from 'trc-react/dist/CsvMatchInput';
import { ListColumns } from 'trc-react/dist/ListColumns';
import { SimpleTable } from 'trc-react/dist/SimpleTable';
import { AllQuestions } from "trc-react/dist/Questions";

declare var _trcGlobal: IMajorState;

interface ILookupValues {
    RecId: string;
    First: string;
    Last: string;
    City: string;
    Zip: string;
}

// Lets somebody lookup a voter, and then answer questions about them. 
// See all answers in Audit. 
export class App extends React.Component<{}, {
    // record: any // if undefined, still picking a voter. 
    results?: ISheetContents // results of search
    totalFound?: number,
    searchCriteria?: ILookupValues
}>
{
    private _topN = 10;

    public constructor(props: any) {
        super(props);

        this.state = {            
        };
        this.renderBody1 = this.renderBody1.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.onSubmitAnswers = this.onSubmitAnswers.bind(this);
    }

    private onSearch(record: ILookupValues) {
        // Do the search
        // alert(record.First + "  " + record.Last + " " + " " + record.City + " " + record.Zip );

        // In-memory search 
        var result = this.search3(record);
        var totalFound = result["RecId"].length;
        result = SheetContents.TakeN(result, this._topN);
        this.setState({ 
            results: result, 
            totalFound: totalFound,
            searchCriteria :  record });
    }

    private static norm(x: string): string {
        if (x == null || x == undefined || x.length == 0) {
            return null;
        }
        return x.toUpperCase();
    }

    // target is already normalized. other is not. 
    private static Mismatch(target: string, other: string): boolean {
        if (!target) {
            return false;
        }
        other = App.norm(other);
        return (other != target);
    }

    // Return the rows in _data that match the filter.  
    public search3(
        record : ILookupValues
    ): ISheetContents { 
        return this.search2(record.RecId, record.First, record.Last, record.City, record.Zip);
    }

    // Return the rows in _data that match the filter.  
    public search2(
        recId: string,
        first: string,
        last: string,
        city: string,
        zip: string
    ): ISheetContents {
        var data = _trcGlobal._contents;

        first = App.norm(first);
        last = App.norm(last);
        city = App.norm(city);
        zip = App.norm(zip);

        var cRecIds = data[ColumnNames.RecId];
        var cFirst = data[ColumnNames.FirstName];
        var cLast = data[ColumnNames.LastName];
        var cCity = data[ColumnNames.City];
        var cZip = data[ColumnNames.Zip];

        // $$$ Compare - if ends in "*", do a suffix match.         
        var result = SheetContents.KeepRows(data,
            (iRow) => {
                if (App.Mismatch(recId, cRecIds[iRow]) ||
                    App.Mismatch(last, cLast[iRow]) ||
                    App.Mismatch(first, cFirst[iRow]) ||
                    App.Mismatch(city, cCity[iRow]) ||
                    App.Mismatch(zip, cZip[iRow])) {
                    return false;
                }
                return true;
            });

        return result;
    }

    // Apply to currently selected. 
    private onSubmitAnswers(answers: any) {

        var idx = 0; // selected from search results. 
        var data = this.state.results;
        var recId = data["RecId"][idx];

        var columnNames: string[] = [];
        var newValues: string[] = [];

        // UpdateApply update to global data
        // var data = _trcGlobal._contents;
        var srcData = _trcGlobal._contents;
        var idxSrc = srcData["RecId"].indexOf(recId);

        for (var columnName in answers) {
            var answer = answers[columnName];
            columnNames.push(columnName);
            newValues.push(answer);

            srcData[columnName][idxSrc] = answer; // Update in-memory sheet.
        }

        // Push result to server 
        _trcGlobal.SheetClient.postUpdateSingleRowAsync(recId, columnNames, newValues).then(() => {
            // Success. Now go back to looking up another voter.
            alert("Successfully recorded");

            //var c = this.state.counter;
            //this.setState({ counter : c+1}); 
            this.onSearch(this.state.searchCriteria);
        }).catch((err) => {
            alert("Failed to post response: " + err);
        });
    }

    private renderQuestions() {
        var data = this.state.results;

        if (!data) 
        {
            return <div>No search results.</div>
        }
        if (data["RecId"].length > 1) 
        {
            return <div>Must reduce to a single record. You can use RecId criteria to specify an exact record. </div>
        }
        return <div><p>Fill in answers for: {data["RecId"][0]}</p>
            <AllQuestions 
                onSubmit={this.onSubmitAnswers}
                columns={_trcGlobal._info.Columns}
            ></AllQuestions>
            </div>

    }

    private renderBody1() {

        return <div>
            <h2>Search</h2>
            <div>Enter Search criteria:</div>
            <div>{_trcGlobal._info.CountRecords} total records. </div>
            <FieldInputs Names={["RecId", "First", "Last", "City", "Zip"]} onSubmit={this.onSearch}></FieldInputs>

            <h3>Search Results</h3>
            {this.state.results && <SimpleTable data={this.state.results} ></SimpleTable>}
            {this.state.totalFound && <p>Found {this.state.totalFound} results.</p>}

            <h3>Edit answers</h3>
            {this.renderQuestions()}
        </div>
    }

    render() {
        return <div>
            <SheetContainer
                onReady={this.renderBody1}
                fetchContents={true}
                requireTop={false}>
            </SheetContainer>
        </div>

    };
}

ReactDOM.render(
    <div>
        <App></App>
    </div>,
    document.getElementById("example")
);