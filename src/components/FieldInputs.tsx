import * as React from "react";

import { Button } from 'trc-react/dist/common/Button';
import { Grid } from "trc-react/dist/common/Grid";
import { HorizontalList } from 'trc-react/dist/common/HorizontalList';
import { TextInput } from "trc-react/dist/common/TextInput";

// Generic control for collecting some input fields.

interface IProps {
    Names: string[]
    onSubmit?: (record: any) => void
}

interface IState {
    Vals: any // keys are from Names
}

export class FieldInputs extends React.Component<IProps, IState> {
    public constructor(props: any) {
        super(props);

        var vals: any = {};
        props.Names.forEach((name: string) => { vals[name] = "" });

        this.state = {
            Vals: vals
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

    private updateFieldState(name: string, val: string): void {
        var vals = this.state.Vals;
        vals[name] = val;
        this.setState({ Vals: vals});
    }

    render() {
        var ns: string[] = this.props.Names;

        const inputs = ns.map((name: string) => (
            <TextInput key={name} type="text" placeholder={"(" + name + ")"}
                value={this.state.Vals[name]}
                onChange={(x) => this.updateFieldState(name, x.target.value)}
                label={name}
            />
        ));

        return (
            <>
                <Grid>
                    {inputs}
                </Grid>

                <HorizontalList alignRight>
                    <Button onClick={this.handleClear} secondary>Clear</Button>
                    <Button onClick={this.handleSubmit}>Search</Button>
                </HorizontalList>
            </>
        );
    }
}
