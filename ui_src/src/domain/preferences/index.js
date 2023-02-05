// Copyright 2022-2023 The Memphis.dev Authors
// Licensed under the Memphis Business Source License 1.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// Changed License: [Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0), as published by the Apache Foundation.
//
// https://github.com/memphisdev/memphis-broker/blob/master/LICENSE
//
// Additional Use Grant: You may make use of the Licensed Work (i) only as part of your own product or service, provided it is not a message broker or a message queue product or service; and (ii) provided that you do not use, provide, distribute, or make available the Licensed Work as a Service.
// A "Service" is a commercial offering, product, hosted, or managed service, that allows third parties (other than your own employees and contractors acting on your behalf) to access and/or use the Licensed Work or a substantial set of the features or functionality of the Licensed Work to third parties as a software-as-a-service, platform-as-a-service, infrastructure-as-a-service or other similar services that compete with Licensor products or services.

import './style.scss';

import React, { useContext, useState, useEffect } from 'react';

import { Context } from '../../hooks/store';
import ClusterConfColor from '../../assets/images/setting/clusterConfColor.svg';
import ClusterConfGray from '../../assets/images/setting/clusterConfGray.svg';
import EditProfileColor from '../../assets/images/setting/editProfileColor.svg';
import EditProfileGray from '../../assets/images/setting/editProfileGray.svg';
import IntegrationColor from '../../assets/images/setting/integrationColor.svg';
import IntegrationGray from '../../assets/images/setting/integrationGray.svg';
import Integrations from './integrations';
import Profile from './profile';
import ClusterConfiguration from './clusterConfiguration';
import { useHistory } from 'react-router-dom';
import pathDomains from '../../router';

function Preferences({ step }) {
    const [selectedMenuItem, selectMenuItem] = useState(step || 'profile');
    const [state, dispatch] = useContext(Context);
    const history = useHistory();

    useEffect(() => {
        dispatch({ type: 'SET_ROUTE', payload: 'preferences' });
    }, []);

    const getComponent = () => {
        switch (selectedMenuItem) {
            case 'profile':
                if (window.location.href.split('/profile').length > 1) {
                    return <Profile />;
                } else {
                    history.replace(`${pathDomains.preferences}/profile`);
                    break;
                }
            case 'cluster_configuration':
                if (window.location.href.split('/cluster_configuration').length > 1) {
                    return <ClusterConfiguration />;
                } else {
                    history.replace(`${pathDomains.preferences}/cluster_configuration`);
                    break;
                }
            case 'integrations':
                if (window.location.href.split('/integrations').length > 1) {
                    return <Integrations />;
                } else {
                    history.replace(`${pathDomains.preferences}/integrations`);
                    break;
                }
            default:
                return;
        }
    };
    return (
        <div className="setting-container">
            <div className="menu-container">
                <p className="header">My account</p>
                <p className="sub-header">Update and manage your account</p>
                <div className="side-menu">
                    <div className={selectedMenuItem === 'profile' ? 'menu-item selected' : 'menu-item'} onClick={() => selectMenuItem('profile')}>
                        <img src={selectedMenuItem === 'profile' ? EditProfileColor : EditProfileGray} alt="editProfile" />
                        Profile
                    </div>
                    <div className={selectedMenuItem === 'integrations' ? 'menu-item selected' : 'menu-item'} onClick={() => selectMenuItem('integrations')}>
                        <img src={selectedMenuItem === 'integrations' ? IntegrationColor : IntegrationGray} alt="notifications" />
                        Integrations
                    </div>
                    <div
                        className={selectedMenuItem === 'cluster_configuration' ? 'menu-item selected' : 'menu-item'}
                        onClick={() => selectMenuItem('cluster_configuration')}
                    >
                        <img src={selectedMenuItem === 'cluster_configuration' ? ClusterConfColor : ClusterConfGray} alt="clusterConfiguration" />
                        Cluster configuration
                    </div>
                </div>
            </div>
            <div className="setting-items">{getComponent()}</div>
        </div>
    );
}
export default Preferences;
