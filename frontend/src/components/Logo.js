import React from "react";

function Logo({ size = 44 }) {
    const ringColor = "#7da2d3";

    return (
        <svg
            viewBox="0 0 420 460"
            width={size}
            height={size}
            role="img"
            aria-label="Student motivational logo"
        >
            <circle cx="210" cy="95" r="30" fill="#f88b00" />

            <path
                d="M26 130 C114 150 161 208 188 267 C204 225 258 163 392 126 C318 178 274 246 233 336 C209 389 192 432 159 453 C179 412 185 359 182 307 C176 240 137 185 26 130 Z"
                fill="#f88b00"
            />

            <ellipse
                cx="214"
                cy="232"
                rx="157"
                ry="57"
                transform="rotate(-8 214 232)"
                fill="none"
                stroke={ringColor}
                strokeWidth="18"
            />

            <ellipse
                cx="203"
                cy="286"
                rx="135"
                ry="50"
                transform="rotate(-8 203 286)"
                fill="none"
                stroke={ringColor}
                strokeWidth="16"
            />

            <ellipse
                cx="194"
                cy="333"
                rx="109"
                ry="40"
                transform="rotate(-8 194 333)"
                fill="none"
                stroke={ringColor}
                strokeWidth="14"
            />

            <path
                d="M358 45 L366 72 L394 74 L371 90 L378 118 L358 99 L338 118 L345 90 L322 74 L350 72 Z"
                fill="#f88b00"
            />
        </svg>
    );
}

export default Logo;
