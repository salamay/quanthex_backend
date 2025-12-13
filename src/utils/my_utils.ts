import { randomUUID, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
export class MyUtils {


    static generateLetterCode(length: number = 6): string {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return result;
    }

    static generateUUID(): string {
        return uuidv4();
    }

}