

export const EncodeGrid = (eventKey: string, gridIndex: string): string => {
    // return window.btoa(`${eventKey}:${gridIndex}`);
    return `${eventKey};${gridIndex}`;
}

export const DecodeGrid = (encoded: string): [string?, string?] => {
    // try {
    //     const decodedString = window.atob(encoded);
    //     const splitDecodedString = decodedString.split(":");
    //     if (splitDecodedString.length == 2) {
    //         return [splitDecodedString[0], splitDecodedString[1]];
    //     } else {
    //         return [undefined, undefined];
    //     }
    // } catch (e) {
    //     return [undefined, undefined];
    // }

    const splitDecodedString = encoded.split(";");
    if (splitDecodedString.length == 2) {
        return [splitDecodedString[0], splitDecodedString[1]];
    } else {
        return [undefined, undefined];
    }
}