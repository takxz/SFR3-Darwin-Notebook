import {useRef, useState} from 'react';
import './Login.css';
import Input from '../../../components/inputs/Inputs'; 

export default function LogIn({ }) {
    const [email, setEmail] =  useState('');
    const [password, setPassword] =  useState('');
    const submitRef = useRef();

    const sendLogin = () => {
        console.log(
            email, 
            password
        );
    }

    return (
        <div className=''>
            <div className='form'>
                <div className='form-group'>
                    <Input
                        label='Email'
                        id='email'
                        type='email'
                        name='email'
                        onKeyUp={(value) => setEmail(value)}
                        format={/(.*)@(.*)/}
                        errorMsg="Veuillez entrer une adresse email valide"
                        submitRef={submitRef} 
                    />
                </div>
                <div className='form-group'>
                    <Input
                        label='Mot de passe'
                        id='password'
                        type='password'
                        name='password'
                        onKeyUp={(value) => setPassword(value)} 
                    />
                </div>
                <div className='form-group'>
                    <button onClick={sendLogin} ref={submitRef}>Se connecter</button>
                </div>
            </div>
        </div>
    )
}