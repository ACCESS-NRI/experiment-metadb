"use client";

import { Scatter } from "react-chartjs-2";
import {
    Chart as ChartJS,
    TimeScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    CategoryScale,
  } from "chart.js";
  import 'chartjs-adapter-date-fns';
  import annotationPlugin from 'chartjs-plugin-annotation';
  import Slider, { Range } from 'rc-slider';
  import 'rc-slider/assets/index.css';

  ChartJS.register(
    TimeScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    annotationPlugin,
    CategoryScale
  );
import { useEffect, useRef, useState } from "react"
//import catelogData  from "../VariableData/ryf9091_relam_grouped.json"
import Checkbox from "@/app/components/Checkbox";

export default function CatelogExplorer({params}) {
    let chartOptions
    const [catelog, setCatelog] = useState()
    const [plotData, setPlotData] = useState([]);
    const [freqAxis, setFreqAxis] = useState();
    const [freqVariables, setFreqVariable] = useState([])
    const chartRef = useRef(null);
    const [currentRealm, setCurrentRealm] = useState([])
    const [currentFreq, setCurrentFreq] = useState()
    const [realmFreqs, setRealmFreqs] = useState([])
    const [realms, setRealms] = useState([])

    useEffect(() => {
        getCatelog()
    },[])

    useEffect(() => {
        if (catelog) {
            const realmList = Object.keys(catelog["realms"])
            setRealms(realmList)
            const currRealm = realmList[0]
            setCurrentRealm(currRealm)
            setRealmFreqs(Object.keys(catelog["realms"][currRealm]))
        }
    },[catelog])

    useEffect(() => {
        plotVariable(currentFreq)
    }, [freqVariables]);

    useEffect(() => {
       plotFrequency(currentFreq)
    }, [currentFreq]);

    const getCatelog = async  () => {
        const catelogData = await require(`../VariableData/${params.catelog}.json`)
        setCatelog(catelogData)
    }

    const randomColorGenerator = () => {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        return "rgb(" + r + "," + g + "," + b + ")";
     };

    const plotFrequency = (freq) => {
        if (currentRealm && catelog) {
            const realmData = catelog["realms"]
            setFreqVariable([])
            let newFreqVariables = []
            for (const grp in realmData[currentRealm][freq]) {
                if (realmData[currentRealm][freq][grp]['timestamp'].length != 0) {
                    newFreqVariables.push({
                        name: grp,
                        color: randomColorGenerator(),
                        isVisible: true,
                        variables: realmData[currentRealm][freq][grp]["variables"]
                    })
                }
            }
            setFreqVariable(newFreqVariables)
            setFreqAxis({
                grid: {
                    display: false
                },
                type: 'category',
                offset: true,
                labels: newFreqVariables.map(e => e.name),
                ticks: {
                    autoSkip: false,
                    display: false
                },
                position: 'left',
            })
        }
    }

    const plotVariable = (freq) => {
        setPlotData([])
        if (catelog) {
            const realmData = catelog["realms"]
            for (const grp of freqVariables) {
                if(grp.isVisible) {
                    for (const dates of realmData[currentRealm][freq][grp.name]["timestamp"]) {
                        setPlotData(data => [...data, {
                            type: 'line',
                            mode: 'horizontal',
                            xMin: dates[0],
                            xMax: dates[1],
                            yMin: grp.name,
                            yMax: grp.name,
                            //yScaleID: freq,
                            borderColor: grp.color,
                            label: {
                                display: false,
                                content: grp.name,
                                backgroundColor: "black",
                                color: "white",
                            },
                            enter({element}, event) {
                                element.label.options.display = true;
                                return true;
                            },
                            leave({element}, event) {
                                element.label.options.display = false;
                                return true;
                            }
                        }])
                    }
                }
            }
        }
    }

    const handleCheckboxChange = (label, checked) => {
        const newFreqVariables = freqVariables.map(element => {
            if (element.name === label) {
                return {
                    ...element, isVisible: !checked
                } 
            } else {
                    return element
            }
        })
        setFreqVariable(newFreqVariables)
    }

    const addDays = (date, days) => {
        let result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    const handleSliderChange = (value) => {
        let start = new Date(catelog["model_start_date"])
        let end = new Date(catelog["model_end_date"])
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        chartRef.current.config._config.options.scales.x.min = addDays(start, Math.floor(diffDays*value[0]/100))
        chartRef.current.config._config.options.scales.x.max = addDays(start, Math.floor(diffDays*value[1]/100))
        chartRef.current.update()
    }

    const realmChanged = (event) => {
        const realm = event.target.value
        setCurrentRealm(realm)
        setRealmFreqs(Object.keys(catelog['realms'][realm]))
        setCurrentFreq("none")
    }

    const freqChanged = (event) => {
        setCurrentFreq(event.target.value)
    }

    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: "time",
                time: {
                },
                ticks: { 
                    display: true,
                },
                min: catelog ? new Date(catelog["model_start_date"]): null,
                max: catelog ? new Date(catelog["model_end_date"]): null,
                grid: {
                    display: false
                },
            },
            freqAxis
        },
        plugins: {
            legend: {
                display: true
            },
            annotation: {
                annotations: plotData,
            }
        }
    
    }

    return (
      <div style={{display: "flex", justifyContent: 'center', alignItems: 'center', flexDirection:'column', padding: '5%'}}>
        <select value={currentRealm || "none"} onChange={realmChanged}>
            <option value={"none"} selected disabled hidden>Select a realm</option>
            {realms.map(realm => <option key={realm}value={realm}>{realm}</option>)}
        </select>
        <select value={currentFreq || "none"} onChange={freqChanged}>
            <option value={"none"} selected disabled hidden>Select a frequency</option>
            {realmFreqs.map(freq => <option key={freq} value={freq}>{freq}</option>)}
        </select>
        <div class="chart-container" style={{height:"30vh", width:"100%"}}>
            {(currentFreq && currentFreq != 'none') && <Scatter ref={chartRef} options={chartOptions} data={{datasets: []}} />}
            {(currentFreq && currentFreq != 'none') && <Slider range
                onChange={handleSliderChange}
                defaultValue={[0, 100]}
            />}
        </div>
        <div style={{ marginTop: "20px", columnGap: "20px", width: "100%", display:"grid", gridTemplateColumns: "auto-fill max-content"}}>
            {freqVariables.map((grp,i) => 
                <Checkbox label={grp.name} 
                    key={grp.name + " " + i} 
                    color={grp.color}
                    variables={grp.variables}
                    checked={grp.isVisible} onChange={handleCheckboxChange} />
            )}
        </div>
        
      </div>
    )
}
  