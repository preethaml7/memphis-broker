// Licensed under the MIT License (the "License");
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// This license limiting reselling the software itself "AS IS".

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import './style.scss';

import React, { useEffect, useContext, useState, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { ApiEndpoints } from '../../const/apiEndpoints';
import StationBoxOverview from './stationBoxOverview';
import { httpRequest } from '../../services/http';
import Button from '../../components/button';
import Filter from '../../components/filter';
import { Context } from '../../hooks/store';
import SearchInput from '../../components/searchInput';
import pathDomains from '../../router';
import stationsIcon from '../../assets/images/stationIcon.svg';
import searchIcon from '../../assets/images/searchIcon.svg';
import StationsInstructions from '../../components/stationsInstructions';
import Modal from '../../components/modal';
import CreateStationDetails from '../../components/createStationDetails';
import Loader from '../../components/loader';
import { filterType, labelType } from '../../const/filterConsts';
import { CircleLetterColor } from '../../const/circleLetterColor';

const StationsList = () => {
    const history = useHistory();

    const [state, dispatch] = useContext(Context);
    const [modalIsOpen, modalFlip] = useState(false);
    const [stationsList, setStationList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [isLoading, setisLoading] = useState(false);
    const [creatingProsessd, setCreatingProsessd] = useState(false);
    const [filterTerms, setFilterTerms] = useState([]);
    const [tagList, setTagList] = useState([]);
    const [filterFields, setFilterFields] = useState([]);
    const createStationRef = useRef(null);

    useEffect(() => {
        dispatch({ type: 'SET_ROUTE', payload: 'stations' });
        getTags();
        getAllStations();
    }, []);

    useEffect(() => {
        tagList.length > 0 && filterFields.findIndex((x) => x.name === 'tags') === -1 && getTagsFilter(tagList);
    }, [tagList]);

    useEffect(() => {
        if (searchInput.length >= 2) setFilteredList(stationsList.filter((station) => station.station.name.includes(searchInput)));
        else setFilteredList(stationsList);
    }, [searchInput]);

    useEffect(() => {
        filterTerms.length > 0 && handleFilter();
    }, [filterTerms]);

    useEffect(() => {
        if (searchInput !== '' && searchInput.length >= 2) {
            setFilteredList(stationsList.filter((station) => station.station.name.includes(searchInput)));
        } else setFilteredList(stationsList);
        filterTerms.length > 0 && handleFilter();
    }, [stationsList]);

    const getTagsFilter = (tags) => {
        const fields = tagList.map((tag) => {
            return {
                name: tag.name,
                color: `rgba(${tag.color})`,
                checked: false
            };
        });
        const tagFilter = {
            name: 'tags',
            value: 'Tags',
            labelType: labelType.BADGE,
            filterType: filterType.CHECKBOX,
            fields: fields
        };
        let filteredFields = filterFields;
        filteredFields.push(tagFilter);
        setFilterFields(filteredFields);
    };

    const getCreatedByFilter = (stations) => {
        let createdBy = [];
        stations.forEach((item) => {
            createdBy.push(item.station.created_by_user);
        });
        const created = [...new Set(createdBy)].map((user) => {
            return {
                name: user,
                color: CircleLetterColor[user[0].toUpperCase()],
                checked: false
            };
        });
        const cratedFilter = {
            name: 'created',
            value: 'Created By',
            labelType: labelType.CIRCLEDLETTER,
            filterType: filterType.CHECKBOX,
            fields: created
        };
        let filteredFields = filterFields;
        filteredFields.push(cratedFilter);
        setFilterFields(filteredFields);
    };

    const getStorageTypeFilter = () => {
        const storageTypeFilter = {
            name: 'storage',
            value: 'Storage Type',
            filterType: filterType.RADIOBUTTON,
            radioValue: -1,
            fields: [{ name: 'Memory' }, { name: 'File' }]
        };
        let filteredFields = filterFields;
        filteredFields.push(storageTypeFilter);
        setFilterFields(filteredFields);
    };

    const getFilterData = (stations) => {
        filterFields.findIndex((x) => x.name === 'created') === -1 && getCreatedByFilter(stations);
        filterFields.findIndex((x) => x.name === 'storage') === -1 && getStorageTypeFilter();
    };

    const getTags = async () => {
        try {
            const res = await httpRequest('GET', `${ApiEndpoints.GET_ACTIVE_TAGS}`);
            setTagList(res);
        } catch (err) {
            return;
        }
    };

    const getAllStations = async () => {
        setisLoading(true);
        try {
            const res = await httpRequest('GET', `${ApiEndpoints.GET_STATIONS}`);
            getFilterData(res.stations);
            res.stations.sort((a, b) => new Date(b.station.creation_date) - new Date(a.station.creation_date));
            setStationList(res.stations);
            setFilteredList(res.stations);
            setTimeout(() => {
                setisLoading(false);
            }, 500);
        } catch (err) {
            setisLoading(false);
            return;
        }
    };

    const handleSearch = (e) => {
        setSearchInput(e.target.value);
    };

    const handleFilter = () => {
        let objCreated = [];
        let objStorage = [];
        try {
            objCreated = filterTerms.find((o) => o.name === 'tags').fields.map((element) => element.toLowerCase());
        } catch {}
        try {
            objCreated = filterTerms.find((o) => o.name === 'created').fields.map((element) => element.toLowerCase());
        } catch {}
        try {
            objStorage = filterTerms.find((o) => o.name === 'storage').fields.map((element) => element.toLowerCase());
        } catch {}
        const data = stationsList
            // .filter((item) => (objCreated.length > 0 ? objCreated.includes(item.station.tags) : !objCreated.includes(item.station.tags)))
            .filter((item) => (objCreated.length > 0 ? objCreated.includes(item.station.created_by_user) : !objCreated.includes(item.station.created_by_user)))
            .filter((item) => (objStorage.length > 0 ? objStorage.includes(item.station.storage_type) : !objStorage.includes(item.station.storage_type)));
        setFilteredList(data);
    };

    const handleRegisterToStation = useCallback(() => {
        state.socket?.emit('get_all_stations_data');
    }, [state.socket]);

    useEffect(() => {
        state.socket?.on(`stations_overview_data`, (data) => {
            data.sort((a, b) => new Date(b.station.creation_date) - new Date(a.station.creation_date));
            setStationList(data);
        });

        state.socket?.on('error', (error) => {
            history.push(pathDomains.overview);
        });

        setTimeout(() => {
            handleRegisterToStation();
        }, 1000);

        return () => {
            state.socket?.emit('deregister');
        };
    }, [state.socket]);

    const removeStation = async (stationName) => {
        try {
            await httpRequest('DELETE', ApiEndpoints.REMOVE_STATION, {
                station_name: stationName
            });
            setStationList(stationsList.filter((station) => station.station.name !== stationName));
        } catch (error) {
            return;
        }
    };

    const renderStationsOverview = () => {
        if (stationsList?.length > 0) {
            if (stationsList?.length <= 2) {
                return (
                    <div>
                        {filteredList?.map((station) => (
                            <StationBoxOverview key={station.station.id} station={station} removeStation={() => removeStation(station.station.name)} />
                        ))}
                        <StationsInstructions header="Add more stations" button="Add Station" newStation={() => modalFlip(true)} />
                    </div>
                );
            }
            return filteredList?.map((station) => (
                <StationBoxOverview key={station.station.id} station={station} removeStation={() => removeStation(station.station.name)} />
            ));
        }
        return <StationsInstructions header="You don’t have any station yet?" button="Create New Station" image={stationsIcon} newStation={() => modalFlip(true)} />;
    };

    return (
        <div className="stations-details-container">
            <div className="stations-details-header">
                <div className="left-side">
                    <label className="main-header-h1">
                        Stations <label className="num-stations">{stationsList?.length > 0 && `(${stationsList?.length})`}</label>
                    </label>
                </div>
                {stationsList?.length > 0 ? (
                    <div className="right-side">
                        <SearchInput
                            placeholder="Search Stations"
                            placeholderColor="red"
                            width="280px"
                            height="37px"
                            borderRadiusType="circle"
                            backgroundColorType="gray-dark"
                            iconComponent={<img src={searchIcon} />}
                            onChange={handleSearch}
                            value={searchInput}
                        />
                        <Filter filterFields={filterFields} filtersUpdated={(e) => setFilterTerms(e)} />
                        <Button
                            className="modal-btn"
                            width="180px"
                            height="37px"
                            placeholder="Create New Station"
                            colorType="white"
                            radiusType="circle"
                            backgroundColorType="purple"
                            fontSize="14px"
                            fontWeight="bold"
                            aria-controls="usecse-menu"
                            aria-haspopup="true"
                            onClick={() => modalFlip(true)}
                        />
                    </div>
                ) : null}
            </div>
            {isLoading && (
                <div className="loader-uploading">
                    <Loader />
                </div>
            )}
            {!isLoading && <div className="stations-content">{renderStationsOverview()}</div>}
            <div id="e2e-createstation-modal">
                <Modal
                    header="Your station details"
                    height="460px"
                    rBtnText="Add"
                    lBtnText="Cancel"
                    lBtnClick={() => {
                        modalFlip(false);
                    }}
                    rBtnClick={() => {
                        createStationRef.current();
                    }}
                    clickOutside={() => modalFlip(false)}
                    open={modalIsOpen}
                    isLoading={creatingProsessd}
                >
                    <CreateStationDetails createStationRef={createStationRef} handleClick={(e) => setCreatingProsessd(e)} />
                </Modal>
            </div>
        </div>
    );
};

export default StationsList;
