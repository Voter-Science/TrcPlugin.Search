import * as React from "react";

import { Button } from 'trc-react/dist/common/Button';
import { Grid } from "trc-react/dist/common/Grid";
import { HorizontalList } from 'trc-react/dist/common/HorizontalList';
import { TextInput } from "trc-react/dist/common/TextInput";

// Generic control for collecting some input fields.

interface IProps {
    data: any;
    Names: string[];
    Keys: string[];
    onSubmit?: (record: any) => void;
}

interface IState {
    Vals: any; // keys are from Names
    activeInputKey: string;
    dataListItems: string[];
}

export class FieldInputs extends React.Component<IProps, IState> {
    public constructor(props: any) {
        super(props);

        var vals: any = {};
        props.Names.forEach((name: string) => { vals[name] = "" });

        this.state = {
            Vals: vals,
            activeInputKey: null,
            dataListItems: []
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClear = this.handleClear.bind(this);
    }

    handleClear() {
        var vals: any = {};
        this.props.Names.forEach((name: string) => { vals[name] = "" });
        this.setState({ Vals: vals});
    }

    handleSubmit(event: any) {
        // Normalize data. Convert "" to undefined.
        var x: any = {};
        for(var key in this.state.Vals) {
            var val = this.state.Vals[key];
            if (val && val.length > 0 ) {
                x[key] = val;
            }
        }

        var c = this.props.onSubmit;

        if (c) {
            c(x);
        }

        event.preventDefault();
    }

    private updateFieldState(name: string, val: string, key: string): void {
        var vals = this.state.Vals;
        vals[name] = val;

        const uniqueValues = [...new Set(this.props.data[key])] as string[];
        const filteredDataList = uniqueValues
            .filter((x: string) => {
                const a = x.toLowerCase();
                const b = val.toLowerCase();
                if (a === b) return false;
                return a.indexOf(b) !== -1;
            })
            .slice(0, 8);

        this.setState({
            Vals: vals,
            activeInputKey: key,
            dataListItems: filteredDataList
        });
    }

    render() {
        const { data, Keys, Names } = this.props;

        const inputs = Names.map((name: string, i) => (
            <div>
                <TextInput
                    key={name}
                    type="text"
                    placeholder={"(" + name + ")"}
                    value={this.state.Vals[name]}
                    onChange={(x) => this.updateFieldState(name, x.target.value, Keys[i])}
                    label={name}
                    list={`datalist-${Keys[i]}`}
                />
            </div>
        ));

        return (
            <>
                <Grid>
                    {inputs}
                </Grid>

                {this.state.dataListItems.length > 0 && (
                    <datalist id={`datalist-${this.state.activeInputKey}`}>
                        {this.state.dataListItems.map((value: string, i: number) => (
                            <option key={i} value={value} />
                        ))}
                    </datalist>
                )}

                <HorizontalList alignRight>
                    <Button onClick={this.handleClear} secondary>Clear</Button>
                    <Button onClick={this.handleSubmit}>Search</Button>
                </HorizontalList>
            </>
        );
    }
}
