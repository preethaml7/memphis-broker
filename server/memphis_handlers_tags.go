// Credit for The NATS.IO Authors
// Copyright 2021-2022 The Memphis Authors
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
package server

import (
	"context"
	"errors"
	"memphis-broker/models"
	"memphis-broker/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TagsHandler struct{ S *Server }

const (
	tagObjectName = "Tag"
)

func validateTagName(name string) error {
	return validateName(name, tagObjectName)
}

func CreateTag(name string, from string, from_name string, background_color string, text_color string) error {
	name = strings.ToLower(name)
	err := validateTagName(name)
	if err != nil {
		return err
	}
	exist, _, err := IsTagExist(name)
	if err != nil {
		return err
	}
	if exist {
		return errors.New("Tag with that name already exists")
	}
	var newTag models.Tag
	stationArr := []primitive.ObjectID{}
	schemaArr := []primitive.ObjectID{}
	userArr := []primitive.ObjectID{}
	switch from {
	case "station":
		station_name, err := StationNameFromStr(from_name)
		if err != nil {
			return err
		}
		exist, station, err := IsStationExist(station_name)
		if err != nil {
			return err
		}
		if !exist {
			return errors.New("Station with this name does not exist")
		}
		stationArr = append(stationArr, station.ID)
	case "schema":
		exist, schema, err := IsSchemaExist(from_name)
		if err != nil {
			return err
		}
		if !exist {
			return errors.New("Schema with this name does not exist")
		}
		schemaArr = append(schemaArr, schema.ID)
	case "user":
		exist, user, err := IsUserExist(from_name)
		if err != nil {
			return err
		}
		if !exist {
			return errors.New("User with this name does not exist")
		}
		userArr = append(userArr, user.ID)
	}
	newTag = models.Tag{
		ID:       primitive.NewObjectID(),
		Name:     name,
		ColorBG:  background_color,
		ColorTXT: text_color,
		Stations: stationArr,
		Schemas:  schemaArr,
		Users:    userArr,
	}
	_, err = tagsCollection.InsertOne(context.TODO(), newTag)
	if err != nil {
		return err
	}
	return nil
}

func AddTag(name string, to string, to_name string, background_color string, text_color string) error {
	name = strings.ToLower(name)
	err := validateTagName(name)
	if err != nil {
		return err
	}
	exist, tag, err := IsTagExist(name)
	if err != nil {
		return err
	}
	if !exist {
		err = CreateTag(name, to, to_name, background_color, text_color)
		if err != nil {
			return err
		}
		return nil
	}
	switch to {
	case "station":
		station_name, err := StationNameFromStr(to_name)
		if err != nil {
			return err
		}
		exist, station, err := IsStationExist(station_name)
		if err != nil {
			return err
		}
		if !exist {
			return errors.New("Station with this name does not exist")
		}
		_, err = tagsCollection.UpdateOne(context.TODO(), bson.M{"_id": tag.ID}, bson.M{"$addToSet": bson.M{"stations": station.ID}})
		if err != nil {
			return err
		}

	case "schema":
		exist, schema, err := IsSchemaExist(to_name)
		if err != nil {
			return err
		}
		if !exist {
			return errors.New("Schema with this name does not exist")
		}
		_, err = tagsCollection.UpdateOne(context.TODO(), bson.M{"_id": tag.ID}, bson.M{"$addToSet": bson.M{"schemas": schema.ID}})
		if err != nil {
			return err
		}
	case "user":
		exist, user, err := IsUserExist(to_name)
		if err != nil {
			return err
		}
		if !exist {
			return errors.New("User with this name does not exist")
		}
		_, err = tagsCollection.UpdateOne(context.TODO(), bson.M{"_id": tag.ID}, bson.M{"$addToSet": bson.M{"users": user.ID}})
		if err != nil {
			return err
		}
	}
	return nil
}

func DeleteTagsByStation(name string) {
	station_name, err := StationNameFromStr(name)
	if err != nil {
		serv.Errorf("Failed creating a tag: %v", err.Error())
		return
	}
	exist, station, err := IsStationExist(station_name)
	if err != nil {
		serv.Errorf("Failed deleting tags: %v", err.Error())
		return
	}
	if !exist {
		serv.Errorf("Station with this name does not exist")
		return
	}
	_, err = tagsCollection.UpdateMany(context.TODO(), bson.M{}, bson.M{"$pull": bson.M{"stations": station.ID}})
	if err != nil {
		serv.Errorf("Failed deleting tags: %v", err.Error())
		return
	}
}

func DeleteTagsBySchema(name string) {
	exist, schema, err := IsSchemaExist(name)
	if err != nil {
		serv.Errorf("Failed deleting tags: %v", err.Error())
		return
	}
	if !exist {
		serv.Errorf("Schema with this name does not exist")
		return
	}
	_, err = tagsCollection.UpdateMany(context.TODO(), bson.M{}, bson.M{"$pull": bson.M{"schemas": schema.ID}})
	if err != nil {
		serv.Errorf("Failed deleting tags: %v", err.Error())
		return
	}
}

func DeleteTagsByUser(name string) {
	exist, user, err := IsUserExist(name)
	if err != nil {
		serv.Errorf("Failed deleting tags: %v", err.Error())
		return
	}
	if !exist {
		serv.Errorf("User with this name does not exist")
		return
	}
	_, err = tagsCollection.UpdateMany(context.TODO(), bson.M{}, bson.M{"$pull": bson.M{"users": user.ID}})
	if err != nil {
		serv.Errorf("Failed deleting tags: %v", err.Error())
		return
	}
}

func checkIfEmptyAndDelete(name string) {
	exist, tag, _ := IsTagExist(name)
	if exist {

		if len(tag.Schemas) == 0 && len(tag.Stations) == 0 && len(tag.Users) == 0 {
			_, err := tagsCollection.DeleteOne(context.TODO(), bson.M{"_id": tag.ID})
			if err != nil {
				serv.Warnf("Delete tag error:" + err.Error())
			}
		}
	}
}

func (th TagsHandler) CreateTag(c *gin.Context) {
	var body models.CreateTagSchema
	ok := utils.Validate(c, &body, false, nil)
	if !ok {
		return
	}
	name := strings.ToLower(body.Name)
	err := validateTagName(name)
	if err != nil {
		serv.Errorf("Failed creating tag: %v", err.Error())
		c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
		return
	}
	err = AddTag(body.Name, body.From, body.FromName, body.ColorBG, body.ColorTXT)
	if err != nil {
		serv.Errorf("Failed creating tag: %v", err.Error())
		c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
		return
	}
	c.IndentedJSON(200, []string{})
}

func (th TagsHandler) RemoveTag(c *gin.Context) {
	var body models.RemoveTagSchema
	ok := utils.Validate(c, &body, false, nil)
	if !ok {
		return
	}
	name := strings.ToLower(body.Name)
	err := validateTagName(name)
	if err != nil {
		serv.Errorf("RemoveTag error: " + err.Error())
		c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
		return
	}
	exist, tag, err := IsTagExist(name)
	if err != nil {
		serv.Errorf("RemoveTag error: " + err.Error())
		c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
		return
	}
	if !exist {
		serv.Errorf("Tag with this name does not exist")
		c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
		return
	}
	switch body.From {
	case "station":
		station_name, err := StationNameFromStr(body.FromName)
		if err != nil {
			serv.Errorf("RemoveTag error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
		exist, station, err := IsStationExist(station_name)
		if err != nil {
			serv.Errorf("RemoveTag error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
		if !exist {
			serv.Errorf("Station with this name does not exist")
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
		_, err = tagsCollection.UpdateOne(context.TODO(), bson.M{"_id": tag.ID},
			bson.M{"$pull": bson.M{"stations": station.ID}})
		if err != nil {
			serv.Errorf("RemoveTag error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}

	case "schema":
		exist, schema, err := IsSchemaExist(body.FromName)
		if err != nil {
			serv.Errorf("RemoveTag error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
		if !exist {
			serv.Errorf("Schema with this name does not exist")
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
		_, err = tagsCollection.UpdateOne(context.TODO(), bson.M{"_id": tag.ID},
			bson.M{"$pull": bson.M{"schemas": schema.ID}})
		if err != nil {
			serv.Errorf("RemoveTag error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
	case "user":
		exist, user, err := IsUserExist(body.FromName)
		if err != nil {
			serv.Errorf("RemoveTag error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
		if !exist {
			serv.Errorf("User with this name does not exist")
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
		_, err = tagsCollection.UpdateOne(context.TODO(), bson.M{"_id": tag.ID},
			bson.M{"$pull": bson.M{"users": user.ID}})
		if err != nil {
			serv.Errorf("RemoveTag error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
	default:
		serv.Errorf("RemoveTag error: " + err.Error())
		c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
		return
	}

	checkIfEmptyAndDelete(name)
	c.IndentedJSON(200, []string{})
}

func (th TagsHandler) GetTagsByStation(station_id primitive.ObjectID) ([]models.Tag, error) {
	var tags []models.Tag
	cursor, err := tagsCollection.Find(context.TODO(), bson.M{"stations": station_id})

	if err != nil {
		return tags, err
	}

	if err = cursor.All(context.TODO(), &tags); err != nil {
		return tags, err
	}

	if len(tags) == 0 {
		tags = []models.Tag{}
	}

	return tags, nil
}

func (th TagsHandler) GetTagsBySchema(schema_id primitive.ObjectID) ([]models.Tag, error) {
	var tags []models.Tag
	cursor, err := tagsCollection.Find(context.TODO(), bson.M{"schemas": schema_id})
	if err != nil {
		return tags, err
	}

	if err = cursor.All(context.TODO(), &tags); err != nil {
		return tags, err
	}

	if len(tags) == 0 {
		tags = []models.Tag{}
	}

	return tags, nil
}

func (th TagsHandler) GetTagsByUser(user_id primitive.ObjectID) ([]models.Tag, error) {
	var tags []models.Tag
	cursor, err := tagsCollection.Find(context.TODO(), bson.M{"users": user_id})
	if err != nil {
		return tags, err
	}

	if err = cursor.All(context.TODO(), &tags); err != nil {
		return tags, err
	}

	if len(tags) == 0 {
		tags = []models.Tag{}
	}

	return tags, nil
}

func (th TagsHandler) GetAllTags(c *gin.Context) {
	var body models.GetAllTagsSchema
	ok := utils.Validate(c, &body, false, nil)
	if !ok {
		return
	}
	from := strings.ToLower(body.From)
	var tags []models.Tag
	switch from {
	case "stations":
		cursor, err := tagsCollection.Find(context.TODO(), bson.M{"stations": bson.M{"$not": bson.M{"$size": 0}}})
		if err != nil {
			serv.Errorf("GetAllTags error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}

		if err = cursor.All(context.TODO(), &tags); err != nil {
			serv.Errorf("GetAllTags error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
	case "users":
		cursor, err := tagsCollection.Find(context.TODO(), bson.M{"users": bson.M{"$not": bson.M{"$size": 0}}})
		if err != nil {
			serv.Errorf("GetAllTags error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}

		if err = cursor.All(context.TODO(), &tags); err != nil {
			serv.Errorf("GetAllTags error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
	case "schemas":
		cursor, err := tagsCollection.Find(context.TODO(), bson.M{"schemas": bson.M{"$not": bson.M{"$size": 0}}})
		if err != nil {
			serv.Errorf("GetAllTags error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}

		if err = cursor.All(context.TODO(), &tags); err != nil {
			serv.Errorf("GetAllTags error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
	default:
		cursor, err := tagsCollection.Find(context.TODO(), bson.M{})
		if err != nil {
			serv.Errorf("GetAllTags error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}

		if err = cursor.All(context.TODO(), &tags); err != nil {
			serv.Errorf("GetAllTags error: " + err.Error())
			c.AbortWithStatusJSON(500, gin.H{"message": "Server error"})
			return
		}
	}

	if len(tags) == 0 {
		tags = []models.Tag{}
	}

	c.IndentedJSON(200, tags)
}
