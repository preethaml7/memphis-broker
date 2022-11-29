// Credit for The NATS.IO Authors
// Copyright 2021-2022 The Memphis Authors
// Licensed under the Apache License, Version 2.0 (the “License”);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an “AS IS” BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.package server

import './style.scss';

import React, { useEffect, useContext } from 'react';

import IntegrationItem from './components/integrationItem';
import { INTEGRATION_LIST } from '../../../const/integrationList';
import { ApiEndpoints } from '../../../const/apiEndpoints';
import { httpRequest } from '../../../services/http';
import { Context } from '../../../hooks/store';

const Integrations = () => {
    const [state, dispatch] = useContext(Context);

    useEffect(() => {
        getallIntegration();
    }, []);

    const getallIntegration = async () => {
        try {
            const data = await httpRequest('GET', ApiEndpoints.GET_ALL_INTEGRATION);
            dispatch({ type: 'SET_INTEGRATIONS', payload: data || [] });
        } catch (err) {
            return;
        }
    };

    return (
        <div className="alerts-integrations-container">
            <div className="header-preferences">
                <p className="main-header">Integrations</p>
                <p className="sub-header">We will keep an eye on your data streams and alert you if anything went wron</p>
            </div>
            <div className="integration-list">
                {INTEGRATION_LIST?.map((integration) => {
                    return <IntegrationItem key={integration.name} value={integration} />;
                })}
            </div>
        </div>
    );
};

export default Integrations;
