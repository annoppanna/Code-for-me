import React from "react";

//yarn add @types/react-qr-reader
//yarn add react-qr-reader
//yarn add tesseract.js

import QrReader from "react-qr-reader";
import "./App.css";
import { createWorker } from "tesseract.js";

function App() {
  const [result, setResult] = React.useState();

  const check = { date: "false" };
  const [image, setImage] = React.useState() as any;
  const imageSize = {
    width: 0,
    height: 0,
  };
  const [textResult, setTextResult] = React.useState([""]) as any;
  const [CurrentDayNumber, setCurrentDayNumber] = React.useState("0");
  const qrCodeSet = {
    qrCodeSet1: "0039000600000101030040218",
    qrCodeSet3: "5102TH9104",
    currentNumdayDay: "",
    currentday: "",
    dayNumber: "",
    timeHours: "",
    timeMin: "",
    CodeRef: "",
  };
  const qrRef = React.useRef(null) as any;

  const [isLoading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(-1);
  const [boxSize, setBoxSize] = React.useState([]) as any;

  const worker1 = createWorker({
    logger: (m) => {
      // console.log(m);
      if (m.status === "recognizing text") {
        setProgress(m.progress * 100); //if want to use progress bar when loading
      }
    },
  });
  const handleErrorFile = (error: any) => {
    console.log(error);
    setLoading(false);
    setTextResult();
  };

  const handleImageLoad = (e: any) => {
    //console.log("event", e);
    console.log("Width", e.target.naturalWidth); //1146
    console.log("Height", e.target.naturalHeight); //1320

    setImage(e.target.currentSrc);
    imageSize.width = e.target.naturalWidth;
    imageSize.height = e.target.naturalHeight;
    console.log("imageSize", imageSize);
    setBoxSize([
      {
        top: e.target.naturalHeight / 13.2,
        left: 50,
        width: 400,
        height: 50,
      },
    ]);
  };

  const onScanFile = (e: any) => {
    qrRef.current.openImageDialog();
  };

  const handleScanFile = async (result: any) => {
    if (result) {
      setLoading(true);
      setResult(result);
      setTextResult();

      const today = new Date() as any;
      const fullyear = new Date(today.getFullYear(), 0, 1) as any;
      const currentDayNumber = Math.ceil((today - fullyear) / 86400000) as any;
      const day = today.getDate();

      console.log("current number day", currentDayNumber);
      console.log("curernt day number", day);

      setCurrentDayNumber(currentDayNumber);

      const qrCodeStr1 = result.slice(0, 25); //qrcode set 1
      const qrCodeRef = result.slice(25, 43); //qrcode set 2 timestamp
      const qrCodeStr3 = result.slice(43, 53); //qrcode set 3
      const qrCodeStr4 = result.slice(53, 57); //qrcode set 4

      const dayScan = qrCodeRef.slice(3, 6);
      const timeScan = qrCodeRef.slice(6, 10);

      // console.log("day scan from qrcode", dayScan);
      // console.log("time scan from qrcode", timeScan);

      qrCodeSet.currentNumdayDay = currentDayNumber;
      qrCodeSet.currentday = day;
      qrCodeSet.dayNumber = dayScan;
      qrCodeSet.timeHours = timeScan.slice(0, 2);
      qrCodeSet.timeMin = timeScan.slice(2, 4);
      // console.log("qrcode set", qrCodeSet);

      await worker1.load();
      await worker1.loadLanguage("eng");
      await worker1.initialize("eng");
      const values = [];
      const textfilter = [] as any;
      //console.log("box top", boxSize[0].top);
      for (let i = 0; i < boxSize.length; i++) {
        const {
          data: { text },
        } = await worker1.recognize(image, { rectangle: boxSize[i] });
        console.log("text", text);
        const regex = /\d+/g;
        const string = text;
        const matches = string.match(regex);

        values.push(text);
        textfilter.push(matches);
      }

      // console.log("text scan", values);
      // console.log("text filter", textfilter);

      setTextResult(textfilter);
    }
  };

  if (textResult) {
    // console.log("day number today", qrCodeSet.currentNumdayDay);
    // console.log("day number scan", qrCodeSet.dayNumber);
    // console.log("text scan time", textResult[0][2]);
    // console.log("text qr time", qrCodeSet.timeHours);
    if (
      textResult[0][0] === qrCodeSet.currentday &&
      textResult[0][2] === qrCodeSet.timeHours &&
      textResult[0][3] === qrCodeSet.timeMin &&
      qrCodeSet.currentday === CurrentDayNumber
    ) {
      // console.log("success date");
      check.date = "true";
    } else {
      // console.log("invalid date");
      check.date = "false";
    }
  }
  //const showResult = textResult[0];

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "20px",
      }}
    >
      <div
        style={{
          position: "relative",
          left: "34%",
          width: "30%",
          marginBottom: "20px",
        }}
      >
        <QrReader
          ref={qrRef}
          delay={300}
          onError={handleErrorFile}
          onScan={handleScanFile}
          legacyMode
          onImageLoad={handleImageLoad}
        />
      </div>
      <button
        color="secondary"
        onClick={onScanFile}
        style={{ width: "200px", height: "50px" }}
      >
        Scan Qr Code
      </button>
      <h3>Scanned Code From Qrcode : {result}</h3>

      <div className="pin-box">
        {isLoading &&
          (textResult ? (
            <>
              <h2>
                Scan text from receipt: date {textResult[0][0]} , time{" "}
                {textResult[0][2]} : {textResult[0][3]}
              </h2>
              <h2>{check.date}</h2>
            </>
          ) : (
            <div>Loading</div>
          ))}
      </div>
    </div>
  );
}
export default App;
