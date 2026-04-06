const INSTITUTIONS = [
    {
        id: "astra",
        name: "ASTRA NEET JEE Coaching Portal",
        shortName: "ASTRA",
        themeColor: "#0f766e"
    },
    {
        id: "aakash",
        name: "Aakash NEET JEE Institute",
        shortName: "Aakash",
        themeColor: "#1f4b99"
    },
    {
        id: "allen",
        name: "Allen Career Institute",
        shortName: "Allen",
        themeColor: "#8a3b12"
    },
    {
        id: "generic-neet-jee",
        name: "Generic NEET JEE Institute",
        shortName: "NEET JEE Institute",
        themeColor: "#7c2d12"
    }
];

const DEFAULT_INSTITUTION = INSTITUTIONS[0];

function findInstitutionById(institutionId) {
    const normalizedId = String(institutionId || "").trim().toLowerCase();
    return INSTITUTIONS.find((institution) => institution.id === normalizedId) || null;
}

module.exports = {
    INSTITUTIONS,
    DEFAULT_INSTITUTION,
    findInstitutionById
};
