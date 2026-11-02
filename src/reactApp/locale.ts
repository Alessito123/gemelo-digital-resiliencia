import {createContext,useContext} from 'react';
export const Locale=createContext({en:false,dark:false});
export function useText(){const {en}=useContext(Locale);return (es:string,english:string)=>en?english:es;}
