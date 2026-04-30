#!/usr/bin/env python3
"""Generate ~500 global food items for VitaChain"""
import json

# Common global foods with nutritional data per 100g
# Source: USDA and common food composition tables

foods = [
    # Fruits
    {"id": "gl-001", "name": "Apple", "category": "Fruits", "per100g": {"calories": 52, "protein": 0.3, "carbs": 14.0, "fat": 0.2, "fiber": 2.4, "sodium": 1}, "region": "global"},
    {"id": "gl-002", "name": "Banana", "category": "Fruits", "per100g": {"calories": 89, "protein": 1.1, "carbs": 22.8, "fat": 0.3, "fiber": 2.6, "sodium": 1}, "region": "global"},
    {"id": "gl-003", "name": "Orange", "category": "Fruits", "per100g": {"calories": 47, "protein": 0.9, "carbs": 11.8, "fat": 0.1, "fiber": 2.4, "sodium": 0}, "region": "global"},
    {"id": "gl-004", "name": "Strawberries", "category": "Fruits", "per100g": {"calories": 32, "protein": 0.7, "carbs": 7.7, "fat": 0.3, "fiber": 2.0, "sodium": 1}, "region": "global"},
    {"id": "gl-005", "name": "Grapes", "category": "Fruits", "per100g": {"calories": 69, "protein": 0.7, "carbs": 18.1, "fat": 0.2, "fiber": 0.9, "sodium": 2}, "region": "global"},
    {"id": "gl-006", "name": "Watermelon", "category": "Fruits", "per100g": {"calories": 30, "protein": 0.6, "carbs": 7.6, "fat": 0.2, "fiber": 0.4, "sodium": 1}, "region": "global"},
    {"id": "gl-007", "name": "Pineapple", "category": "Fruits", "per100g": {"calories": 50, "protein": 0.5, "carbs": 13.1, "fat": 0.1, "fiber": 1.4, "sodium": 1}, "region": "global"},
    {"id": "gl-008", "name": "Mango", "category": "Fruits", "per100g": {"calories": 60, "protein": 0.8, "carbs": 15.0, "fat": 0.4, "fiber": 1.6, "sodium": 1}, "region": "global"},
    {"id": "gl-009", "name": "Peach", "category": "Fruits", "per100g": {"calories": 39, "protein": 0.9, "carbs": 9.5, "fat": 0.3, "fiber": 1.5, "sodium": 0}, "region": "global"},
    {"id": "gl-010", "name": "Pear", "category": "Fruits", "per100g": {"calories": 57, "protein": 0.4, "carbs": 15.2, "fat": 0.1, "fiber": 3.1, "sodium": 1}, "region": "global"},
    {"id": "gl-011", "name": "Kiwi", "category": "Fruits", "per100g": {"calories": 61, "protein": 1.1, "carbs": 14.7, "fat": 0.5, "fiber": 3.0, "sodium": 3}, "region": "global"},
    {"id": "gl-012", "name": "Blueberries", "category": "Fruits", "per100g": {"calories": 57, "protein": 0.7, "carbs": 14.5, "fat": 0.3, "fiber": 2.4, "sodium": 1}, "region": "global"},
    {"id": "gl-013", "name": "Raspberries", "category": "Fruits", "per100g": {"calories": 52, "protein": 1.2, "carbs": 11.9, "fat": 0.7, "fiber": 6.5, "sodium": 1}, "region": "global"},
    {"id": "gl-014", "name": "Blackberries", "category": "Fruits", "per100g": {"calories": 43, "protein": 1.4, "carbs": 9.6, "fat": 0.5, "fiber": 5.3, "sodium": 1}, "region": "global"},
    {"id": "gl-015", "name": "Lemon", "category": "Fruits", "per100g": {"calories": 29, "protein": 1.1, "carbs": 9.3, "fat": 0.3, "fiber": 2.8, "sodium": 2}, "region": "global"},
    {"id": "gl-016", "name": "Lime", "category": "Fruits", "per100g": {"calories": 30, "protein": 0.7, "carbs": 10.5, "fat": 0.2, "fiber": 2.8, "sodium": 2}, "region": "global"},
    {"id": "gl-017", "name": "Pomegranate", "category": "Fruits", "per100g": {"calories": 83, "protein": 1.7, "carbs": 18.7, "fat": 1.2, "fiber": 4.0, "sodium": 3}, "region": "global"},
    {"id": "gl-018", "name": "Plum", "category": "Fruits", "per100g": {"calories": 46, "protein": 0.7, "carbs": 11.4, "fat": 0.3, "fiber": 1.4, "sodium": 0}, "region": "global"},
    {"id": "gl-019", "name": "Apricot", "category": "Fruits", "per100g": {"calories": 48, "protein": 1.4, "carbs": 11.1, "fat": 0.4, "fiber": 2.0, "sodium": 1}, "region": "global"},
    {"id": "gl-020", "name": "Cherry", "category": "Fruits", "per100g": {"calories": 50, "protein": 1.0, "carbs": 12.0, "fat": 0.3, "fiber": 1.6, "sodium": 3}, "region": "global"},
