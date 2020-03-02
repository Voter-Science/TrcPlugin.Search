import * as React from "react";
import * as ReactDOM from "react-dom";


// Generic control for collecting some input fields. 
export class FieldInputs extends React.Component<{
    Names : string[]
    onSubmit?: (record: any) => void
}, {
    Vals : any // keys are from Names
}> {
    public constructor(props: any) {
        super(props);

        var vals : any = {};
        props.Names.forEach((name : string) => { vals[name] = "" });

        this.state = {
            Vals : vals
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClear = this.handleClear.bind(this);
    }
   
    handleClear() {
        var vals : any = {};
        this.props.Names.forEach((name : string) => { vals[name] = "" });
        this.setState({ Vals : vals});
    }

    handleSubmit(event: any) {

        // Normalize data. Convert "" to undefined. 
        var x : any = {};
        for(var key in this.state.Vals)  
        {
            var val = this.state.Vals[key];
            if (val && val.length > 0 ) { 
                x[key] = val;
            }
        }

        var c = this.props.onSubmit;

        if (c) { c(x) };
        
        event.preventDefault();
    }

    private updateFieldState(name : string, val : string) : void {
        var vals = this.state.Vals;
        vals[name] = val;
        this.setState({ Vals : vals});
    }

    render() {
        var ns : string[] = this.props.Names;
        return <div>
            {ns.map((name : string) => <div  key={"_x" + name}>
                <input key={name} type="text" placeholder={"(" + name + ")"}
                        value={this.state.Vals[name]}
                        onChange={(x) => this.updateFieldState(name, x.target.value)}></input>
            </div>)}

            <button onClick={this.handleSubmit}>Next</button>
            <button onClick={this.handleClear}>Clear</button>
        </div>
    } 
}
