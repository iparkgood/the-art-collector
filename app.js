const BASE_URL = "https://api.harvardartmuseums.org";
const KEY = "apikey=706154fb-90de-4f43-88ff-33fe510f97fe";

async function fetchObjects() {
  const url = `${BASE_URL}/object?${KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
}

// fetchObjects().then((x) => console.log(x)); // { info: {}, records: [{}, {},]}

async function fetchAllCenturies() {
  const url = `${BASE_URL}/century?${KEY}&size=100&sort=temporalorder`;
  //https://api.harvardartmuseums.org/century?apikey=YOUR_API_KEY&size=100&sort=temporalorder

  if (localStorage.getItem("centuries")) {
    return JSON.parse(localStorage.getItem("centuries"));
  } //This will allow us to return the array of centuries before fetching if we've stored them.

  try {
    const response = await fetch(url);
    const data = await response.json();
    const records = data.records;

    localStorage.setItem("centuries", JSON.stringify(records));

    return records;
  } catch (error) {
    console.error(error);
  }
}

async function fetchAllClassifications() {
  const url = `${BASE_URL}/classification?${KEY}&size=100&sort=name`;

  if (localStorage.getItem("classifications")) {
    return JSON.parse(localStorage.getItem("classifications"));
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    const records = data.records;

    localStorage.setItem("classifications", JSON.stringify(records));

    return records;
  } catch (error) {
    console.error(error);
  }
}

function onFetchStart() {
  $("#loading").addClass("active");
}

function onFetchEnd() {
  $("#loading").removeClass("active");
}

async function prefetchCategoryLists() {
  try {
    const [classifications, centuries] = await Promise.all([
      fetchAllClassifications(),
      fetchAllCenturies(),
    ]);

    // This provides a clue to the user, that there are items in the dropdown
    $(".classification-count").text(`(${classifications.length})`);

    classifications.forEach((classification) => {
      const builtEl = `<option value="${classification.name}">${classification.name}</option>`;
      $("#select-classification").append(builtEl);
      // append a correctly formatted option tag into
      // the element with id select-classification
      //<option value="value text">Display Text</option>
    });

    $(".century-count").text(`(${centuries.length})`);

    centuries.forEach((century) => {
      const builtEl = `<option value="${century.name}">${century.name}</option>`;
      $("#select-century").append(builtEl);
    });
  } catch (error) {
    console.error(error);
  }
}

function buildSearchString() {
  const classificationVal = $("#select-classification").val();
  const centuryVal = $("#select-century").val();
  const keywordsVal = $("#keywords").val();

  return `${BASE_URL}/object?${KEY}&classification=${classificationVal}&century=${centuryVal}&keyword=${keywordsVal}`;
}

function renderPreview(record) {
  // grab description, primaryimageurl, and title from the record
  const desc = record.description;
  const primaryimageurl = record.primaryimageurl;
  const title = record.title;

  const builtEl = $("<div class='object-preview'>");

  builtEl
    .html(
      `
      <a href="#">
        ${primaryimageurl ? `<img src=${primaryimageurl} />` : ""}
        ${title ? `<h3>${title}</h3>` : ""}
        ${desc ? `<h3>${desc}</h3>` : ""}
      </a>
    `
    )
    .data("record", record);

  return builtEl;
}

function searchURL(searchType, searchString) {
  return `${BASE_URL}/object?${KEY}&${searchType}=${searchString}`;
}

function factHTML(title, content, searchTerm = null) {
  if (content === null || content === undefined) {
    return "";
  } else if (searchTerm === null) {
    return `<span class="title">${title}</span>
            <span class="content">${content}</span>`;
  } else {
    return `<span class="title">${title}</span>
            <span class="content"><a href="${searchURL(
              searchTerm,
              content
            )}">${content}</a></span>`;
  }
  // if content is empty or undefined, return an empty string ''
  // otherwise, if there is no searchTerm, return the two spans
  // otherwise, return the two spans, with the content wrapped in an anchor tag
}

function photosHTML(images, primaryimageurl) {
  if (images !== null && images.length > 0) {
    return images
      .map(function (image) {
        return `<img src="${image.baseimageurl}" />`;
      })
      .join("");
  } else if (primaryimageurl !== null) {
    return `<img src="${image.primaryimageurl}" />`;
  } else {
    return "";
  }
  // if images is defined AND images.length > 0, map the images to the correct image tags, then join them into a single string. the images have a property called baseimageurl, use that as the value for src
  // else if primaryimageurl is defined, return a single image tag with that as value for src
  // else we have nothing, so return the empty string
}

function renderFeature(record) {
  /**
   * We need to read, from record, the following:
   * HEADER: title, dated
   * FACTS: description, culture, style, technique, medium, dimensions, people, department, division, contact, creditline
   * PHOTOS: images, primaryimageurl
   */

  return $(`<div class="object-feature">
    <header>
      <h3>${record.title}</h3>
      <h4>${record.dated}</h4>
    </header>
    <section class="facts">
      ${factHTML("Description", record.description)}
      ${factHTML("Culture", record.culture, "culture")}
      ${factHTML("Style", record.style)}
      ${factHTML("Technique", record.technique, "technique")}
      ${factHTML("Medium", record.medium, "medium")}
      ${factHTML("Dimensions", record.dimensions)}
      ${
        record.people
          ? record.people
              .map(function (person) {
                return factHTML("Person", person.displayname, "person");
              })
              .join("")
          : ""
      }
      ${factHTML("Department", record.department)}
      ${factHTML("Division", record.division)}
      ${factHTML(
        "Contact",
        `<a target="_blank" href="mailto:${record.contact}">${record.contact}</a>`
        //This opens the user's email in a new window, with the email address auto-populated.
      )}
      ${factHTML("Credit", record.creditline)}
    </section>
    <section class="photos">
      ${photosHTML(record.images, record.primaryimageurl)}
    </section>
  </div>`);
}

function updatePreview(info, records) {
  const root = $("#preview");
  const resultsEl = root.find(".results").empty();

  if (info.next) {
    $(".next").data("url", info.next);
    $(".next").attr("disabled", false);
  } else {
    $(".next").data("url", null);
    $(".next").attr("disabled", true);
  }

  if (info.prev) {
    $(".previous").data("url", info.prev);
    $(".previous").attr("disabled", false);
  } else {
    $(".previous").data("url", null);
    $(".previous").attr("disabled", true);
  }

  /*
    if info.next is present:
      - on the .next button set data with key url equal to info.next
      - also update the disabled attribute to false
    else
      - set the data url to null
      - update the disabled attribute to true


    Do the same for info.prev, with the .previous button
  */

  records.forEach(function (record) {
    resultsEl.append(renderPreview(record));
  });
}

prefetchCategoryLists();

$("#search").on("submit", async function (event) {
  event.preventDefault();

  onFetchStart();

  try {
    const url = buildSearchString();
    const encodedUrl = encodeURI(url);
    // now, encodedUrl will be
    // 'https://api.harvardartmuseums.org?apikey=351673f0-777e-11ea-b7b8-399da107d1d6&keyword=mona%20lisa'

    const response = await fetch(encodedUrl);
    const data = await response.json();

    updatePreview(data.info, data.records);
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
});

$("#preview .next, #preview .previous").on("click", async function () {
  onFetchStart();

  try {
    const targetUrl = $(this).data("url");
    const response = await fetch(targetUrl);
    const { info, records } = await response.json();

    updatePreview(info, records);
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
});

$("#preview").on("click", ".object-preview", function (event) {
  event.preventDefault();

  const objectPreviewEl = event.target.closest(".object-preview");
  const record = $(objectPreviewEl).data("record");

  $("#feature").html(renderFeature(record));
});

$("#feature").on("click", "a", async function (event) {
  const href = $(this).attr("href");

  if (href.startsWith("mailto")) {
    return;
  }

  event.preventDefault();

  onFetchStart();

  try {
    const response = await fetch(href);
    const { info, records } = await response.json();

    updatePreview(info, records);
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
});
