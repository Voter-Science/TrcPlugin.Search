import * as React from "react";
import * as ReactDOM from "react-dom";

import { SheetContainer, IMajorState } from 'trc-react/dist/SheetContainer'
import { FieldInputs } from './components/FieldInputs'
import { ColumnNames, ISheetContents, SheetContents } from "trc-sheet/sheetContents";

import { Copy } from 'trc-react/dist/common/Copy';
import { Grid } from 'trc-react/dist/common/Grid';
import { Panel } from 'trc-react/dist/common/Panel';
import { PluginLink } from "trc-react/dist/PluginLink";
import { PluginShell } from 'trc-react/dist/PluginShell';
import { AllQuestions } from "trc-react/dist/Questions";
import { SimpleTable } from 'trc-react/dist/SimpleTable';

declare var _trcGlobal: IMajorState;

interface ILookupValues {
    RecId: string;
    First: string;
    Last: string;
    Address :string;
    City: string;
    Zip: string;
    PrecinctName : string;
}

interface IState {
    results?: ISheetContents // results of search
    totalFound?: number,
    searchCriteria?: ILookupValues
}

// Lets somebody lookup a voter, and then answer questions about them.
// See all answers in Audit.
export class App extends React.Component<{}, IState> {
    private _topN = 10;

    public constructor(props: any) {
        super(props);

        this.state = {}

        this.renderBody1 = this.renderBody1.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.onSubmitAnswers = this.onSubmitAnswers.bind(this);
    }

    private onSearch(record: ILookupValues) {
        // Do the search

        // In-memory search
        var result = this.search3(record);
        var totalFound = result["RecId"].length;
        result = SheetContents.TakeN(result, this._topN);
        this.setState({
            results: result,
            totalFound: totalFound,
            searchCriteria :  record
        });
    }

    private static norm(x: string): string {
        if (x == null || x == undefined || x.length == 0) {
            return null;
        }
        // trip leading / ending blanks.
        return x.trim().toUpperCase();
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
    public search3(record : ILookupValues): ISheetContents {
        return this.search2(
            record.RecId,
            record.First,
            record.Last,
            record.Address,
            record.City,
            record.Zip,
            record.PrecinctName
        );
    }

    // Return the rows in _data that match the filter.
    public search2(
        recId: string,
        first: string,
        last: string,
        address :string,
        city: string,
        zip: string,
        precinctName : string
    ): ISheetContents {
        var data = _trcGlobal._contents;

        first = App.norm(first);
        last = App.norm(last);
        address = App.norm(address);
        city = App.norm(city);
        zip = App.norm(zip);
        precinctName = App.norm(precinctName);

        var cRecIds = data[ColumnNames.RecId];
        var cFirst = data[ColumnNames.FirstName];
        var cLast = data[ColumnNames.LastName];
        var cAddress = data[ColumnNames.Address];
        var cCity = data[ColumnNames.City];
        var cZip = data[ColumnNames.Zip];
        var cPrecinctName = data[ColumnNames.PrecinctName];

        // $$$ Compare - if ends in "*", do a suffix match.
        var result = SheetContents.KeepRows(data,
            (iRow) => {
                if (
                    App.Mismatch(recId, cRecIds[iRow]) ||
                    App.Mismatch(last, cLast[iRow]) ||
                    App.Mismatch(first, cFirst[iRow]) ||
                    App.Mismatch(address, cAddress[iRow]) ||
                    App.Mismatch(city, cCity[iRow]) ||
                    App.Mismatch(zip, cZip[iRow]) ||
                    App.Mismatch(precinctName, cPrecinctName[iRow])
                ) {
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
        var srcData = _trcGlobal._contents;
        var idxSrc = srcData["RecId"].indexOf(recId);

        for (var columnName in answers) {
            var answer = answers[columnName];
            columnNames.push(columnName);
            newValues.push(answer);

            srcData[columnName][idxSrc] = answer; // Update in-memory sheet.
        }

        // Push result to server
        _trcGlobal.SheetClient.postUpdateSingleRowAsync(recId, columnNames, newValues)
            .then(() => {
                // Success. Now go back to looking up another voter.
                alert("Successfully recorded");
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
            return (
                <div>
                    Must reduce to a single record. You can use RecId criteria
                    to specify an exact record.
                </div>
            )
        }
        return (
            <div>
                <p>Fill in answers for: {data["RecId"][0]}</p>
                <AllQuestions
                    onSubmit={this.onSubmitAnswers}
                    columns={_trcGlobal._info.Columns}
                />
            </div>
        )

    }

    private renderBody1() {

        return (
            <PluginShell
                description={
                    <>
                        <p>
                            This searches for specific individuals within the sheet and
                            will also let you update answers for them.
                        </p>
                        <p>
                            Use <PluginLink id={"Filter"}></PluginLink> to get counts.
                        </p>
                    </>
                }
                title="Search"
            >
                <Panel>
                    <Grid>
                        <Copy>
                            <p>Enter search criteria (blanks match everything):</p>
                        </Copy>
                        <Copy alignRight bold>
                            <p>
                                {_trcGlobal._info.CountRecords} total records
                            </p>
                        </Copy>
                    </Grid>
                    <FieldInputs
                        Names={["RecId", "First", "Last", "Address", "City", "Zip", "PrecinctName"]}
                        onSubmit={this.onSearch}
                    />
                </Panel>

                <Panel>
                    <h3>Search results</h3>
                    {this.state.totalFound && (
                        <p>Found {this.state.totalFound} total result(s).</p>
                    )}
                    {(this.state.totalFound  && this.state.totalFound > this._topN) && (
                        <p>Showing first {this._topN} results. Narrow the search further.</p>
                    )}
                    {this.state.results && (
                        <SimpleTable
                            downloadIcon
                            data={this.state.results}
                            onRowClick={(recId: string) => alert(recId)}
                        />
                    )}
                    {!this.state.totalFound && <div>Results will appear here.</div>}
                </Panel>

                <Panel>
                    <h3>Edit answers</h3>
                    {this.renderQuestions()}
                </Panel>

            </PluginShell>
        );
    }

    render() {
        return (
            <div>
                <SheetContainer
                    onReady={this.renderBody1}
                    fetchContents={true}
                    requireTop={false}>
                </SheetContainer>
            </div>
        );
    };
}

ReactDOM.render(
    <App />,
    document.getElementById("example")
);
