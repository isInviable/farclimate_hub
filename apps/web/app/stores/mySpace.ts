import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMySpaceStore = defineStore('my-space', () => {
    const spaceItems = ref([
      {
        id: "note-1",
        type: "text",
        title: "Pinned Note",
        colSpan: "md:col-span-2",
        data: {
          content:
            "This is a pinned text snippet. It could be a note, a summary, or any other piece of text that you want to save for later. The content is taken from the element it's attached to.",
        },
      },
      {
        id: "map-1",
        type: "map",
        title: "Pinned Location",
        colSpan: "md:col-span-2",
        data: {
          points: [
            {
              label: "Rotterdam",
              location: { lat: 51.9225, lon: 4.47917 },
              articleId: "1",
            },
            {
              label: "Copenhagen",
              location: { lat: 55.6761, lon: 12.5683 },
              articleId: "2",
            },
          ],
        },
      },
      {
        id: "chart-1",
        type: "chart",
        title: "Implementation Years",
        colSpan: "md:col-span-4",
        data: {
          results: [
            { implementation_years: { start_year: 2018 } },
            { implementation_years: { start_year: 2019 } },
            { implementation_years: { start_year: 2019 } },
            { implementation_years: { start_year: 2020 } },
            { implementation_years: { start_year: 2021 } },
            { implementation_years: { start_year: 2021 } },
            { implementation_years: { start_year: 2021 } },
          ],
        },
      },
      {
        id: "article-1",
        type: "article",
        title: "Rotterdam port adaptation",
        colSpan: "md:col-span-4",
        data: {
          document: {
            category: "Case Study",
            subcategory: "Adaptation Measure",
            keywords:
              "sea-level-rise, port-infrastructure, adaptation-strategy",
            sector: "Transport",
            climate_impact: "Coastal flooding",
            title:
              "Rotterdam port adaptation strategy for climate resilient transport",
            description:
              "This case study details the strategy developed by the Port of Rotterdam to address the impacts of climate change, focusing on sea-level rise and extreme weather events.",
            location: "Rotterdam, Netherlands",
            scale: "Regional",
            start_year: "2018",
            end_year: "2030",
            phase: "Implementation",
            budget: "€50M - €100M",
            institutions: ["Port of Rotterdam Authority"],
            contacts: ["John Doe (john.doe@portofrotterdam.com)"],
            references: ["Port of Rotterdam Climate Adaptation Plan 2022"],
            published_date: "2022-08-15",
            context: "The port is a critical hub for international trade.",
            solutions:
              "Construction of higher sea walls and storm surge barriers.",
          },
        },
      },
      {
        id: "image-1",
        type: "image",
        title: "Pinned Image",
        colSpan: "md:col-span-2",
        data: {
          src: "/media/FLORA-Forest Worker Scene-60855218.jpg",
          alt: "Pinned Image",
        },
      },
      {
        id: "bars-1",
        type: "bars",
        title: "Sector Breakdown",
        colSpan: "md:col-span-2",
        data: {
          elements: [
            {
              label: "Agriculture",
              slug: "Agriculture",
              icon: "mdi:tractor-variant",
              count: 20,
            },
            {
              label: "Fishery",
              slug: "fishery",
              icon: "ph:fish-simple-bold",
              count: 30,
            },
            {
              label: "Forestry",
              slug: "forestry",
              icon: "ri:tree-line",
              count: 10,
            },
          ],
        },
      },
    ]);

    return {
        spaceItems
    }
}) 