import {useSchool} from '../../store/School';
import {freshUniversity,readUniversity,UNIVERSITY_KEY,type UniversityState} from './engine';
export function useUniversity(){
 const school=useSchool();let data:UniversityState;let corrupt=false;
 try{data=readUniversity(school.state.drafts[UNIVERSITY_KEY]);}catch{data=freshUniversity();corrupt=true;}
 const change=(fn:(s:UniversityState)=>UniversityState)=>{
   if(corrupt)throw Error('SAVED_DATA_INVALID');
   school.update(p=>({...p,drafts:{...p.drafts,[UNIVERSITY_KEY]:JSON.stringify(fn(readUniversity(p.drafts[UNIVERSITY_KEY])))}}));
 };
 return {...school,data,corrupt,change};
}
