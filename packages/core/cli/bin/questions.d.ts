/// <reference types="@types/inquirer" />
import inquirer from 'inquirer';
declare const _default: {
    workspaceName: {
        type: string;
        name: string;
        message: string;
        choices: (string | inquirer.Separator)[];
        default: string;
    };
    packageName: (workspace: string) => {
        type: string;
        name: string;
        message: string;
        filter: (input: string) => Promise<string>;
        transformer: (input: string) => string;
        validate: (input: string) => Promise<string | true>;
    };
    confirmPackageName: {
        type: string;
        name: string;
        message: string;
        default: boolean;
    };
};
export default _default;
//# sourceMappingURL=questions.d.ts.map