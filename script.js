d3.select('html').style('opacity', 1);

// Draw Scatter Plot 
const drawScatterPlot = () => {
    d3.select('html').style('pointer-events', 'none')
    window.setTimeout(() => {
      d3.select('html').style('pointer-events', 'all')      
    }, 2500)
  
    let windowWith = window.innerWidth > 500 ? window.innerWidth : 500

    d3.select('html')
      .style('max-width', 'none')
      .style('overflow-x', 'inherit')

    if (windowWith > 500) d3.select('html')
      .style('max-width', '100%')
      .style('overflow-x', 'hidden')

    const margin = {top: 30, right: 50, bottom: 40, left:40}
    const width = windowWith - margin.left - margin.right - 12
    const height = 500 - margin.top - margin.bottom
    
    const svg = d3.select('body').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      
    const xScale = d3.scaleLinear().range([0, width])
    const yScale = d3.scaleLinear().range([height, 0])
    const radiusScale = d3.scaleLinear().range([2, 30])
    const colorScale = d3.scaleOrdinal(d3.schemeCategory20)
      
    const xAxis = d3.axisBottom().scale(xScale).ticks(20, 's')
    const yAxis = d3.axisLeft().scale(yScale).ticks(20, 's')

    const domainColumn = 'Men average annual salary ($)'
    const rangeColumn = 'Women average annual salary ($)'
    const radiusColumn = 'Pay gap ($)'
    const categories = [
      'Admin & organisation',
      'Care & education',
      'Creative & media',
      'Law & justice',
      'Manual Work',
      'Sales & serving others',
      'Science, tech & engineering',
      'Senior managers & execs',
    ]

    d3.csv('us_gender_pay_gap.csv', (error, data) => {
      if (error) console.error('hmmm....')

      const summaryPoints = []
      const seenOccupations = []
      data = data.filter(entry => {
        if (categories.indexOf(entry.Occupation) !== -1) {
          summaryPoints.push(entry)
          return false
        } else if (!seenOccupations.includes(entry.Occupation) && !categories.includes(entry.Occupation)) {
          seenOccupations.push(entry.Occupation)
          return true
        }
      })

      data.forEach((d) => {
        d[domainColumn] = +d[domainColumn]
        d[rangeColumn] = +d[rangeColumn]
        d[radiusColumn] = +d[radiusColumn]
      })

      xScale.domain(d3.extent(data, (d) => d[domainColumn])).nice()
      yScale.domain(d3.extent(data, (d) => d[rangeColumn])).nice()
      radiusScale.domain(d3.extent(data, (d) => Math.abs(d[radiusColumn]))).nice()
      
      const ideal = svg.append('line')
        .style('stroke', 'black')
        .attr('x1', () => xScale(17000))      
        .attr('y1', () => yScale(17000))
        .attr('x2', () => xScale(17000))
        .attr('y2', () => yScale(17000))
        .style('opacity', 0.2)
        .transition().duration(2000)
        .attr('x1', () => xScale(17000))      
        .attr('y1', () => yScale(17000))
        .attr('x2', () => xScale(92000))
        .attr('y2', () => yScale(92000))
    
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('class', 'x-axis')     
        .call(xAxis)

      svg.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'y-axis')        
        .call(yAxis)

      const yLabel = svg.append('text')
        .attr('x', 10)
        .attr('y', 10)
        .attr('dominant-baseline', 'middle')
        .attr('class', 'y-label')        
        .text('👩')

      const xLabel = svg.append('text')
        .attr('x', width)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('class', 'x-label')        
        .text('👨')

      let tooltipFrozen = false
      const tooltip = d3.select('body')
        .append('span')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('left', '22%')
        .style('top', '180px')
        .style('opacity', 0)
      
      const node = svg.selectAll('circle')
        .data(data)
        .enter().append('circle')
        
      node.attr('cx', d => xScale(d[domainColumn]))
        .attr('cy', d => yScale(d[rangeColumn]))
        .style('fill', d => colorScale(d.Category))
        .attr('r', () => radiusScale(-20))
        .transition().duration(2500)
        .attr('r', d => radiusScale(d[radiusColumn]))
        .attr('class', 'node')
      
      node.on('mouseover', function(d) {
        !tooltipFrozen && xLabel
          .transition()
          .attr('x', xScale(d[domainColumn]))
        !tooltipFrozen && yLabel
          .transition()
          .attr('y', yScale(d[rangeColumn]))
        d3.selectAll('circle')
          .style('opacity', .3)
        d3.select(this)
          .style('opacity', 1)
          .append('text')
        !tooltipFrozen && tooltip
          .classed('hold', false)
          .html(`<b>${d.Occupation}</b><br />
            <span class='difference'>$${Math.abs(d[radiusColumn]).toLocaleString()}</span>
            ${d[radiusColumn] >= 0 ? 'less' : 'more'}<br />
            <span class='man'>$${d[domainColumn].toLocaleString()}</span>&nbsp;
            <span class='woman'>$${d[rangeColumn].toLocaleString()}</span>
          `)
          .style('opacity', .9)          
        })
        .on('mouseout', (d) => {
          d3.selectAll('circle')
            .style('opacity', .7)
          tooltip
            .style('opacity', 0)
        })
        .on('click', (node) => {
          tooltipFrozen = true
          window.setTimeout(() => {
            tooltipFrozen = false     
          }, 1500)
          d3.selectAll('.legend')
            .style('opacity', .5)
            .filter(d => d == node.Category)
            .style('opacity', 1)
          showAll
            .style('opacity', .8)
            .style('pointer-events', 'all')
          d3.selectAll('circle')
            .classed('muted', true)
            .classed('highlighted', false)
            .filter(d => d.Category == node.Category)
            .classed('muted', false)
            .classed('highlighted', true)
          tooltip
            .html(`<b>${node.Occupation}</b><br />
              <span class='difference'>$${Math.abs(node[radiusColumn]).toLocaleString()}</span>
              ${node[radiusColumn] >= 0 ? 'less' : 'more'}<br />
              <span class='man'>$${node[domainColumn].toLocaleString()}</span>&nbsp;
              <span class='woman'>$${node[rangeColumn].toLocaleString()}</span>
            `)
            .classed('hold', true)
        })

      const legend = svg.selectAll('.legend')
        .data(colorScale.domain())
        .enter().append('g')
        .attr('transform', (d,i) => `translate(0,${i * 20})`)
        .attr('class', 'legend')        

      legend.append('rect')
        .attr('x', width)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', colorScale)

      legend.append('text')
        .attr('x', width - 6)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .text(d => d)

      legend.on('click', function(type) {
        d3.selectAll('.legend')
          .style('opacity', .5)
        d3.select(this).style('opacity', 1)
        showAll
          .style('opacity', .8)
          .style('pointer-events', 'all')
        d3.selectAll('circle')
          .classed('muted', false)
          .classed('hidden', true)
          .classed('highlighted', false)
          .filter(d => d.Category == type)
          .classed('hidden', false)
          .classed('highlighted', true)    
      })

      legend.on('mouseover', (type) => {
        d3.selectAll('circle')
          .filter(d => d.Category !== type)
          .style('opacity', .15)
      })
      
      legend.on('mouseout', (type) => {
        d3.selectAll('circle')
          .style('opacity', .7)
      })
        
      const showAll = d3.select('svg')
        .append('g')
        .append('text')
        .attr('class', 'show-all')        
        .attr('x', width + 56)
        .attr('y', 205)
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .style('opacity', 0)
        .text('show all')
        
      showAll.on('click', () => {
        legend.style('opacity', .5)
        showAll
          .style('opacity', 0)
          .style('pointer-events', 'none')
        d3.selectAll('circle')
          .classed('hidden', false)
          .classed('highlighted', false)
          .classed('muted', false)
      })
    })
  }


  //Draw Bar Chart
  const drawBarChart = () => {
    d3.select('html').style('pointer-events', 'none');
    window.setTimeout(() => {
        d3.select('html').style('pointer-events', 'all');
    }, 2500);

    let windowWith = window.innerWidth > 500 ? window.innerWidth : 500;

    d3.select('html')
        .style('max-width', 'none')
        .style('overflow-x', 'inherit');

    if (windowWith > 500) d3.select('html')
        .style('max-width', '100%')
        .style('overflow-x', 'hidden');

    const margin = { top: 30, right: 50, bottom: 40, left: 40 };
    const width = windowWith - margin.left - margin.right - 12;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select('body').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().range([0, width]).padding(0.1);
    const yScale = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom().scale(xScale);
    const yAxis = d3.axisLeft().scale(yScale).ticks(10, 's');

    
    const data = [
        { Year: 2012, Men: 65898, Women: 61679 },
        { Year: 2013, Men: 66794, Women: 62316 },
        { Year: 2014, Men: 68048, Women: 63383 },
        { Year: 2015, Men: 69298, Women: 64445 },
        { Year: 2016, Men: 70589, Women: 65512 },
        { Year: 2017, Men: 71469, Women: 66421 },
        { Year: 2018, Men: 72632, Women: 67467 },
        { Year: 2019, Men: 73349, Women: 68388 },
        { Year: 2020, Men: 68711, Women: 63462 },
        { Year: 2021, Men: 70739, Women: 65654 },
        { Year: 2022, Men: 73672, Women: 68001 }
    ];

    xScale.domain(data.map(d => d.Year));
    yScale.domain([0, d3.max(data, d => Math.max(d.Men, d.Women))]);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('class', 'x-axis')
        .call(xAxis);

    svg.selectAll('.x-axis text')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#333');

    svg.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'y-axis')
        .call(yAxis);

    svg.selectAll('.y-axis text')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#333');

    const bars = svg.selectAll('.bar')
        .data(data)
        .enter().append('g');

    bars.append('rect')
        .attr('class', 'bar-men')
        .attr('x', d => xScale(d.Year))
        .attr('width', xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.Men))
        .attr('height', d => height - yScale(d.Men))
        .attr('fill', 'steelblue')
        .on('mouseover', function (d) {
            tooltip.style('display', null)
                .attr('transform', `translate(${xScale(d.Year) + xScale.bandwidth() / 4},${yScale(d.Men) - 30})`);
            tooltip.select('text').text(`Men: ${d.Men}`);
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
        });

    bars.append('rect')
        .attr('class', 'bar-women')
        .attr('x', d => xScale(d.Year) + xScale.bandwidth() / 2)
        .attr('width', xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.Women))
        .attr('height', d => height - yScale(d.Women))
        .attr('fill', 'orange')
        .on('mouseover', function (d) {
            tooltip.style('display', null)
                .attr('transform', `translate(${xScale(d.Year) + 3 * xScale.bandwidth() / 4},${yScale(d.Women) - 30})`);
            tooltip.select('text').text(`Women: ${d.Women}`);
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
        });

    const tooltip = svg.append('g')
        .attr('class', 'tooltip')
        .style('display', 'none');

    tooltip.append('rect')
        .attr('width', 60)
        .attr('height', 25)
        .attr('fill', 'white')
        .style('opacity', 0.7);

    tooltip.append('text')
        .attr('x', 30)
        .attr('dy', '1.2em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .attr('font-weight', 'bold');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .style('text-anchor', 'middle')
        .text('Year');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', 0 - height / 2)
        .attr('y',  -margin.left - 6)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Salary');

    svg.append('text')
        .attr('x', width / 4)
        .attr('y', -10)
        .style('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text('Men');

    svg.append('text')
        .attr('x', 3 * width / 4)
        .attr('y', -10)
        .style('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text('Women');
};

  //Draw Bar Chart
  const drawLineChart = () => {
    d3.select('html').style('pointer-events', 'none');
    window.setTimeout(() => {
        d3.select('html').style('pointer-events', 'all');
    }, 2500);

    let windowWidth = window.innerWidth > 500 ? window.innerWidth : 500;

    d3.select('html')
        .style('max-width', 'none')
        .style('overflow-x', 'inherit');

    if (windowWidth > 500) d3.select('html')
        .style('max-width', '100%')
        .style('overflow-x', 'hidden');

    const margin = { top: 30, right: 50, bottom: 40, left: 40 };
    const width = windowWidth - margin.left - margin.right - 12;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select('body').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().range([0, width]).padding(0.1);
    const yScale = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom().scale(xScale);
    const yAxis = d3.axisLeft().scale(yScale).ticks(10, 's');

    const data = [
        { Year: 2012, Men: 13.88, Women: 11.99 },
        { Year: 2013, Men: 14.00, Women: 12.12 },
        { Year: 2014, Men: 14.39, Women: 12.18 },
        { Year: 2015, Men: 14.67, Women: 12.56 },
        { Year: 2016, Men: 14.96, Women: 13.01 },
        { Year: 2017, Men: 15.20, Women: 13.56 },
        { Year: 2018, Men: 16.01, Women: 14.06 },
        { Year: 2019, Men: 16.76, Women: 14.85 },
        { Year: 2020, Men: 17.75, Women: 15.22 },
        { Year: 2021, Men: 18.05, Women: 16.02 },
        { Year: 2022, Men: 19.70, Women: 17.18 }
    ];

    xScale.domain(data.map(d => d.Year));
    yScale.domain([0, d3.max(data, d => Math.max(d.Men, d.Women))]);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('class', 'x-axis')
        .call(xAxis);

    svg.selectAll('.x-axis text')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#333');

    svg.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'y-axis')
        .call(yAxis);

    svg.selectAll('.y-axis text')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#333');

        const lineMen = d3.line()
        .x(d => xScale(d.Year) + xScale.bandwidth() / 2)
        .y(d => yScale(d.Men));

    const lineWomen = d3.line()
        .x(d => xScale(d.Year) + xScale.bandwidth() / 2)
        .y(d => yScale(d.Women));

    svg.append('path')
        .data([data])
        .attr('class', 'line-men')
        .attr('d', lineMen)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .on('mouseover', function (d) {
            tooltip.style('display', null)
            .attr('transform', `translate(${xScale(d[0].Year) + xScale.bandwidth() / 2},${yScale(d[0].Men)})`);
            tooltip.select('text').text(`Men: ${d[0].Men}`);
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
        });

    svg.append('path')
        .data([data])
        .attr('class', 'line-women')
        .attr('d', lineWomen)
        .attr('fill', 'none')
        .attr('stroke', 'orange')
        .attr('stroke-width', 2)
        .on('mouseover', function (d) {
            tooltip.style('display', null)
            .attr('transform', `translate(${xScale(d[0].Year) + xScale.bandwidth() / 2},${yScale(d[0].Women)})`);
            tooltip.select('text').text(`Women: ${d[0].Women}`);
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
        });

        svg.selectAll('.circle-men')
        .data(data)
        .enter().append('circle')
        .attr('class', 'circle-men')
        .attr('cx', d => xScale(d.Year) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.Men))
        .attr('r', 5)
        .attr('fill', 'steelblue')
        .on('mouseover', function (d) {
            tooltip.style('display', null)
                .attr('transform', `translate(${xScale(d.Year) + xScale.bandwidth() / 2},${yScale(d.Men)})`);
            tooltip.select('text').text(`Men: ${d.Men}`);
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
        });

    svg.selectAll('.circle-women')
        .data(data)
        .enter().append('circle')
        .attr('class', 'circle-women')
        .attr('cx', d => xScale(d.Year) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.Women))
        .attr('r', 5)
        .attr('fill', 'orange')
        .on('mouseover', function (d) {
            tooltip.style('display', null)
                .attr('transform', `translate(${xScale(d.Year) + xScale.bandwidth() / 2},${yScale(d.Women)})`);
            tooltip.select('text').text(`Women: ${d.Women}`);
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
        });

    const tooltip = svg.append('g')
        .attr('class', 'tooltip')
        .style('display', 'none');

    tooltip.append('rect')
        .attr('width', 60)
        .attr('height', 25)
        .attr('fill', 'white')
        .style('opacity', 0.7);

    tooltip.append('text')
        .attr('x', 30)
        .attr('dy', '1.2em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .attr('font-weight', 'bold');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .style('text-anchor', 'middle')
        .text('Year');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', 0 - height / 2)
        .attr('y', -margin.left - 6)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Median Hourly Earnings');

    svg.append('text')
        .attr('x', width / 4)
        .attr('y', -10)
        .style('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text('Men');

    svg.append('text')
        .attr('x', 3 * width / 4)
        .attr('y', -10)
        .style('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text('Women');
};


  
window.addEventListener('resize', () => {
    d3.select('svg').remove()
    d3.select('.tooltip').remove()      
    draw()
}, true)





d3.select('body')
  .append('h1').text('Gender Pay Gap').style('margin-top', '100px')

drawScatterPlot();

d3.select('body')
  .append('h1').text('Number of Men and Women in the Workforce').style('margin-top', '100px')
  .append('h2').text('(number in thousands)');

drawBarChart();

d3.select('body')
  .append('h1').text('Gender Pay Gap over Time - Median Hourly Earnings').style('margin-top', '100px')
  .append('h2').text('(in dollars)');

drawLineChart();

