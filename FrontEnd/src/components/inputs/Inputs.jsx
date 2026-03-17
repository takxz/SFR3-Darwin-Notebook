import {useRef, useState} from 'react';
import './Inputs.css';

export default function Input({label, id, type, name, onKeyUp, format, errorMsg, submitRef}) {
    const [error, setError] = useState(true);
    const searchButtonRef = useRef();

    const handleKeyUp = (value) => {
        if (!format.test(value)) {
            setError(true);
            submitRef.current.disabled = true;
        } else {
            setError(false);
            submitRef.current.disabled = false;
        }
        onKeyUp(value);
    }

    return (
        <div className='form-group'>
            <label htmlFor={id}>{label}</label>
            <input type={type} id={id} name={name} onKeyUp={(e) => handleKeyUp(e.target.value)} />
            {error &&
                <div className='error'>{errorMsg}</div>
            }
        </div>
    );
}