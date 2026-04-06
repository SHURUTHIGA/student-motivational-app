export const INSTITUTIONS = [
    {
        id: "astra",
        name: "ASTRA NEET JEE Coaching Portal",
        shortName: "ASTRA",
        heroTitle: "Student Portal",
        heroTagline: "Track aspirant readiness, identify risk early, and support every batch with precision.",
        themeColor: "#0f766e"
    },
    {
        id: "aakash",
        name: "Aakash NEET JEE Institute",
        shortName: "Aakash",
        heroTitle: "Aspirant Performance Portal",
        heroTagline: "An institute dashboard for NEET and JEE student motivation, consistency, and intervention.",
        themeColor: "#1f4b99"
    },
    {
        id: "allen",
        name: "Allen Career Institute",
        shortName: "Allen",
        heroTitle: "Coaching Command Center",
        heroTagline: "Built for NEET/JEE institutes that need batch-wise visibility and faster mentor action.",
        themeColor: "#8a3b12"
    },
    {
        id: "generic-neet-jee",
        name: "Generic NEET JEE Institute",
        shortName: "NEET JEE Institute",
        heroTitle: "Institute Motivation Hub",
        heroTagline: "Use this option for any NEET or JEE coaching institute that needs institution-specific branding.",
        themeColor: "#7c2d12"
    }
];

export const DEFAULT_INSTITUTION_ID = process.env.REACT_APP_DEFAULT_INSTITUTION_ID || INSTITUTIONS[0].id;

export function getInstitutionById(institutionId) {
    const normalizedId = String(institutionId || "").trim().toLowerCase();
    return INSTITUTIONS.find((institution) => institution.id === normalizedId) || INSTITUTIONS[0];
}
