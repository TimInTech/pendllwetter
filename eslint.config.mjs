import next from "eslint-config-next"

const config = [
    ...next,
    {
        rules: {
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "react-hooks/exhaustive-deps": "warn",
        },
    },
]

export default config
