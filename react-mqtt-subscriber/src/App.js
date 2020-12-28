import {AppBar, Toolbar, Typography} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import mqttLogo from './mqtt-logo.svg';
import reactLogo from './react-logo.svg';

import './App.css';
import MqttSubscriber from './components/MqttSubscriber';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    logo: {
        height: '3vmin',
        pointerEvents: 'none',
        display: 'inline',
    },
    title: {
        flexGrow: 1,
    },
}));

function App() {
    const classes = useStyles();

    return (
        <div className="">
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        Getting started React & MQTT
                    </Typography>
                    <img src={reactLogo} className={classes.logo} alt="logo" />
                    <img src={mqttLogo} className={classes.logo} alt="logo" />
                </Toolbar>
            </AppBar>

            <MqttSubscriber />
        </div>
    );
}

export default App;
