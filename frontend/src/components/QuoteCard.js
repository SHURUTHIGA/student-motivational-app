import React from "react";

function QuoteCard({ quote, changeQuote }) {
    return (
        <div style={{
            background: "#ffffff",
            padding: "40px",
            borderRadius: "15px",
            textAlign: "center",
            width: "400px",
            boxShadow: "0px 10px 30px rgba(0,0,0,0.35)",
            border: "1px solid #ADBBDA",
            color: "#1f2937"
        }}>
            <h1>Student Motivational App</h1>
            <h2 style={{ color: "#4b5563" }}>{quote}</h2>

            <button
                onClick={changeQuote}
                style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#7091E6",
                    color: "white",
                    fontSize: "16px",
                    cursor: "pointer"
                }}
            >
                New Quote
            </button>
        </div>
    );
}

export default QuoteCard;



